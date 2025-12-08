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
export const UpdateAvailableVersionStatusSchema = z.object({ type: z.literal("update_available") });
export const UpdateRecommendedVersionStatusSchema = z.object({ type: z.literal("update_recommended") });
export const UpdateRequiredVersionStatusSchema = z.object({ type: z.literal("update_required") });
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
	/** Min ms between foreground checks (default: 30000) */
	throttleMs?: number;
	/**
	 * Min ms since last successful check before re-checking (default: 300000 = 5min)
	 * Set this to 0 to disable cooldown and check immediately on every foreground transition.
	 * Set to -1 disable checking entirely.
	 */
	checkCooldownMs?: number;
	/** Always check on foreground, ignoring throttle (default: true) */
	checkOnForeground?: boolean;
	/** If true, check version even when not identified by using anonymous device identification (default: false) */
	identifyAnonymousDevice?: boolean;
};

const DEFAULT_OPTIONS: Required<ForceUpdateClientOptions> = {
	throttleMs: 30_000, // 30 seconds
	checkCooldownMs: 300_000, // 5 minutes
	checkOnForeground: true,
	identifyAnonymousDevice: false,
};

export const VERSION_STATUS_STORAGE_KEY = "VERSION_STATUS";

export class ForceUpdateClient {
	private emitter = new EventEmitter<VersionStatusChangeEvents>();
	private versionStatus: VersionStatus = { type: "initializing" };
	private unsubscribe: (() => void) | null = null;
	private appStateSubscription: NativeEventSubscription | null = null;
	private lastCheckTime: number | null = null;
	private lastForegroundTime: number | null = null;
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
		// Don't initialize here - defer to initialize()
	}

	initialize(): void {
		if (this.initialized) {
			this.logger.debug("ForceUpdateClient already initialized");
			return;
		}
		this.initialized = true;

		// Load from storage, subscribe to events, and sync with current identity state
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
			this.updateFromVersionStatus(currentState.version_info.status);
		} else {
			this.logger.debug(`Identity not yet identified (${currentState.type}), waiting for identify event`);
		}
	}

	private getVersionStatusFromStorage(): VersionStatus {
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
					this.updateFromVersionStatus(state.version_info.status ?? IdentifyVersionStatusEnum.UP_TO_DATE);
					break;
			}
		});
	}

	private updateFromVersionStatus(status?: IdentifyVersionStatusEnum) {
		if (!status) {
			this.setVersionStatus({ type: "up_to_date" });
			return;
		}

		switch (status) {
			case "UPDATE_AVAILABLE":
				this.setVersionStatus({ type: "update_available" });
				break;
			case "UPDATE_RECOMMENDED":
				this.setVersionStatus({ type: "update_recommended" });
				break;
			case "UPDATE_REQUIRED":
				this.setVersionStatus({ type: "update_required" });
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

			// If checkCooldownMs is -1, disable checking entirely
			if (this.options.checkCooldownMs === -1) {
				this.logger.debug("Version checking disabled (checkCooldownMs = -1)");
				return;
			}

			const now = Date.now();
			const throttleOk = !this.lastForegroundTime || now - this.lastForegroundTime >= this.options.throttleMs;

			// If checkCooldownMs is 0, always allow check (no cooldown)
			// Otherwise, check if enough time has passed since last successful check
			const cooldownOk =
				this.options.checkCooldownMs === 0 ||
				!this.lastCheckTime ||
				now - this.lastCheckTime >= this.options.checkCooldownMs;

			if (this.options.checkOnForeground || (throttleOk && cooldownOk)) {
				this.lastForegroundTime = now;
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
