import { EventEmitter } from "eventemitter3";
import { AppState, type AppStateStatus, type NativeEventSubscription } from "react-native";
import { z } from "zod";
import type { IdentityClient } from "../identity";
import type { Logger, LoggingClient } from "../logging";
import type { StorageClient, SupportedStorage } from "../storage";

// TODO: sort out why importing these enuims from schemas is not working - @teardown/schemas
export enum IdentifyVersionStatusEnum {
	/**
	 * A new version is available
	 */
	UPDATE_AVAILABLE = "UPDATE_AVAILABLE",
	/**
	 * An update is recommended
	 */
	UPDATE_RECOMMENDED = "UPDATE_RECOMMENDED",
	/**
	 * An update is required
	 */
	UPDATE_REQUIRED = "UPDATE_REQUIRED",
	/**
	 * The current version is valid & up to date
	 */
	UP_TO_DATE = "UP_TO_DATE",
	/**
	 * The version or build has been disabled
	 */
	DISABLED = "DISABLED",
}

export const InitializingVersionStatusSchema = z.object({ type: z.literal("initializing") });
export const CheckingVersionStatusSchema = z.object({ type: z.literal("checking") });
export const UpToDateVersionStatusSchema = z.object({ type: z.literal("up_to_date") });
export const UpdateAvailableVersionStatusSchema = z.object({
	type: z.literal("update_available"),
	releaseNotes: z.string().nullable().optional(),
});
export const UpdateRecommendedVersionStatusSchema = z.object({
	type: z.literal("update_recommended"),
	releaseNotes: z.string().nullable().optional(),
});
export const UpdateRequiredVersionStatusSchema = z.object({
	type: z.literal("update_required"),
	releaseNotes: z.string().nullable().optional(),
});
export const DisabledVersionStatusSchema = z.object({ type: z.literal("disabled") });
/**
 * The version status schema.
 * - "initializing" - The version status is initializing.
 * - "checking" - The version status is being checked.
 * - "up_to_date" - The version is up to date.
 * - "update_available" - The version is available for update.
 * - "update_required" - The version is required for update.
 */
export const VersionStatusSchema = z.discriminatedUnion("type", [
	InitializingVersionStatusSchema,
	CheckingVersionStatusSchema,
	UpToDateVersionStatusSchema,
	UpdateAvailableVersionStatusSchema,
	UpdateRecommendedVersionStatusSchema,
	UpdateRequiredVersionStatusSchema,
	DisabledVersionStatusSchema,
]);

export type InitializingVersionStatus = z.infer<typeof InitializingVersionStatusSchema>;
export type CheckingVersionStatus = z.infer<typeof CheckingVersionStatusSchema>;
export type UpToDateVersionStatus = z.infer<typeof UpToDateVersionStatusSchema>;
export type UpdateAvailableVersionStatus = z.infer<typeof UpdateAvailableVersionStatusSchema>;
export type UpdateRecommendedVersionStatus = z.infer<typeof UpdateRecommendedVersionStatusSchema>;
export type UpdateRequiredVersionStatus = z.infer<typeof UpdateRequiredVersionStatusSchema>;
export type DisabledVersionStatus = z.infer<typeof DisabledVersionStatusSchema>;
export type VersionStatus = z.infer<typeof VersionStatusSchema>;

export interface VersionStatusChangeEvents {
	VERSION_STATUS_CHANGED: (status: VersionStatus) => void;
}

export type ForceUpdateClientOptions = {
	/**
	 * Minimum time (ms) between version checks.
	 * Default: 300000 (5 minutes)
	 *
	 * Values below 30 seconds are clamped to 30 seconds to prevent excessive API calls.
	 *
	 * Special values:
	 * - 0: Check on every foreground (no interval)
	 * - -1: Disable automatic version checking entirely
	 *
	 * Example: If checkIntervalMs is 5min and a check completes at 12:00pm,
	 * no new checks occur until 12:05pm, even if user foregrounds the app multiple times.
	 */
	checkIntervalMs?: number;
	/** Check version when app comes to foreground, respecting checkIntervalMs (default: true) */
	checkOnForeground?: boolean;
	/** If true, check version even when not identified by using anonymous device identification (default: false) */
	identifyAnonymousDevice?: boolean;
};

/** Hard minimum interval between checks to prevent excessive API calls */
const MIN_CHECK_INTERVAL_MS = 30_000; // 30 seconds

const DEFAULT_OPTIONS: Required<ForceUpdateClientOptions> = {
	checkIntervalMs: 300_000, // 5 minutes
	checkOnForeground: true,
	identifyAnonymousDevice: false,
};

export const VERSION_STATUS_STORAGE_KEY = "version_status";

export class ForceUpdateClient {
	private emitter = new EventEmitter<VersionStatusChangeEvents>();
	private versionStatus: VersionStatus = { type: "initializing" };
	private unsubscribe: (() => void) | null = null;
	private appStateSubscription: NativeEventSubscription | null = null;
	private lastCheckTime: number | null = null;
	private initialized = false;

	private readonly logger: Logger;
	private readonly storage: SupportedStorage;
	private readonly options: Required<ForceUpdateClientOptions>;

	constructor(
		logging: LoggingClient,
		storage: StorageClient,
		private readonly identity: IdentityClient,
		options: ForceUpdateClientOptions = {}
	) {
		this.logger = logging.createLogger({ name: "ForceUpdateClient" });
		this.storage = storage.createStorage("version");
		this.options = { ...DEFAULT_OPTIONS, ...options };
	}

	initialize(): void {
		if (this.initialized) {
			this.logger.debug("ForceUpdateClient already initialized");
			return;
		}
		this.initialized = true;

		this.versionStatus = this.getVersionStatusFromStorage();
		this.logger.debug(`Initialized with version status: ${this.versionStatus.type}`);
		this.subscribeToIdentity();
		this.initializeFromCurrentIdentityState();
		this.subscribeToAppState();
	}

	private initializeFromCurrentIdentityState() {
		const currentState = this.identity.getIdentifyState();
		this.logger.debug(`Current identity state during init: ${currentState.type}`);
		if (currentState.type === "identified") {
			this.logger.debug(
				`Identity already identified, syncing version status from: ${currentState.version_info.status}`
			);
			this.updateFromVersionInfo(currentState.version_info);
		} else {
			this.logger.debug(`Identity not yet identified (${currentState.type}), waiting for identify event`);
		}
	}

	private getVersionStatusFromStorage(): VersionStatus {
		try {
			const stored = this.storage.getItem(VERSION_STATUS_STORAGE_KEY);

			if (stored == null) {
				this.logger.debug("No stored version status, returning initializing");
				return InitializingVersionStatusSchema.parse({ type: "initializing" });
			}

			const parsed = VersionStatusSchema.parse(JSON.parse(stored));
			this.logger.debug(`Parsed version status from storage: ${parsed.type}`);

			// "checking" and "initializing" are transient states - if we restore them, reset to initializing
			// This can happen if the app was killed during a version check
			if (parsed.type === "checking" || parsed.type === "initializing") {
				this.logger.debug(`Found stale '${parsed.type}' state in storage, resetting to initializing`);
				this.storage.removeItem(VERSION_STATUS_STORAGE_KEY);
				return InitializingVersionStatusSchema.parse({ type: "initializing" });
			}

			return parsed;
		} catch (error) {
			this.logger.error("Error getting version status from storage", { error });
			return InitializingVersionStatusSchema.parse({ type: "initializing" });
		}
	}

	private saveVersionStatusToStorage(status: VersionStatus): void {
		this.storage.setItem(VERSION_STATUS_STORAGE_KEY, JSON.stringify(status));
	}

	private subscribeToIdentity() {
		this.unsubscribe = this.identity.onIdentifyStateChange((state) => {
			this.logger.debug(`Identity state changed: ${state.type}`);
			switch (state.type) {
				case "identifying":
					this.setVersionStatus({ type: "checking" });
					break;
				case "identified":
					this.logger.debug(`Identified with version_info.status: ${state.version_info.status}`);
					this.updateFromVersionInfo(state.version_info);
					break;
			}
		});
	}

	private updateFromVersionInfo(versionInfo: {
		status: IdentifyVersionStatusEnum;
		update: { release_notes: string | null } | null;
	}) {
		const status = versionInfo.status;
		const releaseNotes = versionInfo.update?.release_notes ?? null;

		if (!status) {
			this.setVersionStatus({ type: "up_to_date" });
			return;
		}

		switch (status) {
			case "UPDATE_AVAILABLE":
				this.setVersionStatus(releaseNotes ? { type: "update_available", releaseNotes } : { type: "update_available" });
				break;
			case "UPDATE_RECOMMENDED":
				this.setVersionStatus(
					releaseNotes ? { type: "update_recommended", releaseNotes } : { type: "update_recommended" }
				);
				break;
			case "UPDATE_REQUIRED":
				this.setVersionStatus(releaseNotes ? { type: "update_required", releaseNotes } : { type: "update_required" });
				break;
			case "UP_TO_DATE":
				this.setVersionStatus({ type: "up_to_date" });
				break;
			case "DISABLED":
				this.setVersionStatus({ type: "disabled" });
				break;
			default:
				this.setVersionStatus({ type: "up_to_date" });
		}
	}

	private subscribeToAppState() {
		this.appStateSubscription = AppState.addEventListener("change", this.handleAppStateChange);
	}

	private handleAppStateChange = (nextState: AppStateStatus) => {
		if (nextState === "active") {
			this.logger.debug("App state changed to active");

			// If checkIntervalMs is -1, disable checking entirely
			if (this.options.checkIntervalMs === -1) {
				this.logger.debug("Version checking disabled (checkIntervalMs = -1)");
				return;
			}

			const now = Date.now();

			// Calculate effective interval (clamp to minimum unless 0 for "always check")
			const effectiveInterval =
				this.options.checkIntervalMs === 0 ? 0 : Math.max(this.options.checkIntervalMs, MIN_CHECK_INTERVAL_MS);

			// Check if enough time has passed since last successful check
			const canCheck = effectiveInterval === 0 || !this.lastCheckTime || now - this.lastCheckTime >= effectiveInterval;

			if (this.options.checkOnForeground && canCheck) {
				this.checkVersionOnForeground();
			}
		}
	};

	private async checkVersionOnForeground() {
		this.logger.debug("Checking version status on foreground");
		const result = await this.identity.identify();

		if (!result) {
			this.logger.debug("Skipping version check - not identified");
			return;
		}

		if (result.success) {
			this.lastCheckTime = Date.now();
			// Version status is handled by subscribeToIdentity() listener
		}
	}

	public onVersionStatusChange(listener: (status: VersionStatus) => void) {
		this.emitter.addListener("VERSION_STATUS_CHANGED", listener);
		return () => {
			this.emitter.removeListener("VERSION_STATUS_CHANGED", listener);
		};
	}

	public getVersionStatus(): VersionStatus {
		return this.versionStatus;
	}

	private setVersionStatus(newStatus: VersionStatus) {
		this.logger.debug(`Version status changing: ${this.versionStatus.type} -> ${newStatus.type}`);
		this.versionStatus = newStatus;
		this.saveVersionStatusToStorage(newStatus);
		this.emitter.emit("VERSION_STATUS_CHANGED", newStatus);
	}

	public shutdown() {
		if (this.unsubscribe) {
			this.unsubscribe();
			this.unsubscribe = null;
		}
		if (this.appStateSubscription) {
			this.appStateSubscription.remove();
			this.appStateSubscription = null;
		}
		this.emitter.removeAllListeners("VERSION_STATUS_CHANGED");
	}
}
