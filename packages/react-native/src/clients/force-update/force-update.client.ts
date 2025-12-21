import { EventEmitter } from "eventemitter3";
import { AppState, type AppStateStatus, type NativeEventSubscription } from "react-native";
import { z } from "zod";
import type { IdentityClient, IdentityUser } from "../identity";
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
export const UpdateRequiredVersionStatusSchema = z.object({ type: z.literal("update_required") });

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
	UpdateRequiredVersionStatusSchema,
]);

export type InitializingVersionStatus = z.infer<typeof InitializingVersionStatusSchema>;
export type CheckingVersionStatus = z.infer<typeof CheckingVersionStatusSchema>;
export type UpToDateVersionStatus = z.infer<typeof UpToDateVersionStatusSchema>;
export type UpdateAvailableVersionStatus = z.infer<typeof UpdateAvailableVersionStatusSchema>;
export type UpdateRequiredVersionStatus = z.infer<typeof UpdateRequiredVersionStatusSchema>;
export type VersionStatus = z.infer<typeof VersionStatusSchema>;

export interface VersionStatusChangeEvents {
	VERSION_STATUS_CHANGED: (status: VersionStatus) => void;
}

export interface ForceUpdateClientOptions {
	/** Min ms between foreground checks (default: 30000) */
	throttleMs?: number;
	/** Min ms since last successful check before re-checking (default: 300000 = 5min) */
	checkCooldownMs?: number;
	/** If true, check version even when not identified by using anonymous device identification (default: false) */
	identifyAnonymousDevice?: boolean;
	/** If true, check version on load (default: false) */

}

const DEFAULT_OPTIONS: Required<ForceUpdateClientOptions> = {
	throttleMs: 30_000, // 30 seconds
	checkCooldownMs: 300_000, // 5 minutes
	identifyAnonymousDevice: false,
};

export const VERSION_STATUS_STORAGE_KEY = "VERSION_STATUS";

export class ForceUpdateClient {
	private emitter = new EventEmitter<VersionStatusChangeEvents>();
	private versionStatus: VersionStatus;
	private unsubscribe: (() => void) | null = null;
	private appStateSubscription: NativeEventSubscription | null = null;
	private lastCheckTime: number | null = null;
	private lastForegroundTime: number | null = null;

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
		this.versionStatus = this.getVersionStatusFromStorage();
		this.subscribeToIdentity();
		this.subscribeToAppState();
	}

	private getVersionStatusFromStorage(): VersionStatus {
		const stored = this.storage.getItem(VERSION_STATUS_STORAGE_KEY);
		if (stored == null) {
			return InitializingVersionStatusSchema.parse({ type: "initializing" });
		}

		return VersionStatusSchema.parse(JSON.parse(stored));
	}

	private saveVersionStatusToStorage(status: VersionStatus): void {
		this.storage.setItem(VERSION_STATUS_STORAGE_KEY, JSON.stringify(status));
	}

	private subscribeToIdentity() {
		this.unsubscribe = this.identity.onIdentifyStateChange((state) => {
			if (state.type === "identifying") {
				this.setVersionStatus({ type: "checking" });
			} else if (state.type === "identified") {
				this.updateFromVersionStatus(state.version_info.status ?? IdentifyVersionStatusEnum.UP_TO_DATE);
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
			case "UPDATE_REQUIRED":
				this.setVersionStatus({ type: "update_required" });
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
			const now = Date.now();
			const throttleOk = !this.lastForegroundTime || now - this.lastForegroundTime >= this.options.throttleMs;
			const cooldownOk = !this.lastCheckTime || now - this.lastCheckTime >= this.options.checkCooldownMs;

			this.lastForegroundTime = now;

			if (throttleOk && cooldownOk) {
				this.checkVersionOnForeground();
			}
		}
	};

	private async checkVersionOnForeground() {
		this.logger.info("Checking version status on foreground");
		const result = await this.identity.identify();

		if (!result) {
			this.logger.info("Skipping version check - not identified");
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
		this.logger.info(`Version status changing: ${this.versionStatus.type} -> ${newStatus.type}`);
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
