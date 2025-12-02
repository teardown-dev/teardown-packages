import { EventEmitter } from "eventemitter3";
import { z } from "zod";
import type { IdentityClient, IdentityUser, VersionStatusResponse } from "../identity";
import type { Logger, LoggingClient } from "../logging";
import type { StorageClient, SupportedStorage } from "../storage";
import { AppState, type AppStateStatus, type NativeEventSubscription } from "react-native";

export const UnknownVersionStatusSchema = z.object({ type: z.literal("unknown") });
export const CheckingVersionStatusSchema = z.object({ type: z.literal("checking") });
export const UpToDateVersionStatusSchema = z.object({ type: z.literal("up_to_date") });
export const UpdateAvailableVersionStatusSchema = z.object({ type: z.literal("update_available"), version: z.string() });
export const UpdateRequiredVersionStatusSchema = z.object({ type: z.literal("update_required"), version: z.string() });

/**
 * The version status schema.
 * - "unknown" - The version status is unknown.
 * - "checking" - The version status is being checked.
 * - "up_to_date" - The version is up to date.
 * - "update_available" - The version is available for update.
 * - "update_required" - The version is required for update.
 */
export const VersionStatusSchema = z.discriminatedUnion("type", [
	UnknownVersionStatusSchema,
	CheckingVersionStatusSchema,
	UpToDateVersionStatusSchema,
	UpdateAvailableVersionStatusSchema,
	UpdateRequiredVersionStatusSchema,
]);

export type UnknownVersionStatus = z.infer<typeof UnknownVersionStatusSchema>;
export type CheckingVersionStatus = z.infer<typeof CheckingVersionStatusSchema>;
export type UpToDateVersionStatus = z.infer<typeof UpToDateVersionStatusSchema>;
export type UpdateAvailableVersionStatus = z.infer<typeof UpdateAvailableVersionStatusSchema>;
export type UpdateRequiredVersionStatus = z.infer<typeof UpdateRequiredVersionStatusSchema>;
export type VersionStatus = z.infer<typeof VersionStatusSchema>;

export type VersionStatusChangeEvents = {
	VERSION_STATUS_CHANGED: (status: VersionStatus) => void;
};

export type ForceUpdateClientOptions = {
	/** Min ms between foreground checks (default: 30000) */
	throttleMs?: number;
	/** Min ms since last successful check before re-checking (default: 300000 = 5min) */
	checkCooldownMs?: number;
	/** If true, check version even when not identified by using anonymous device identification (default: false) */
	identifyAnonymousDevice?: boolean;
};

const DEFAULT_OPTIONS: Required<ForceUpdateClientOptions> = {
	throttleMs: 30_000,
	checkCooldownMs: 300_000,
	identifyAnonymousDevice: false,
};

export const VERSION_STATUS_STORAGE_KEY = "VERSION_STATUS";

export class ForceUpdateClient {
	private emitter = new EventEmitter<VersionStatusChangeEvents>();
	private versionStatus: VersionStatus = { type: "unknown" };
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
			return UnknownVersionStatusSchema.parse({ type: "unknown" });
		}

		return VersionStatusSchema.parse(JSON.parse(stored));
	}

	private saveVersionStatusToStorage(status: VersionStatus): void {
		this.storage.setItem(VERSION_STATUS_STORAGE_KEY, JSON.stringify(status));
	}

	private subscribeToIdentity() {
		this.unsubscribe = this.identity.onSessionStateChange((state) => {
			if (state.type === "identifying") {
				this.setVersionStatus({ type: "checking" });
			} else if (state.type === "identified") {
				this.updateFromVersionStatus(state.version_status);
			}
		});
	}

	private updateFromVersionStatus(versionStatus?: VersionStatusResponse) {
		console.log("updateFromVersionStatus", versionStatus);
		if (!versionStatus) {
			this.setVersionStatus({ type: "up_to_date" });
			return;
		}

		const { status, latest_version } = versionStatus;
		switch (status) {
			case "UPDATE_AVAILABLE":
				this.setVersionStatus({ type: "update_available", version: latest_version ?? "unknown" });
				break;
			case "UPDATE_REQUIRED":
				this.setVersionStatus({ type: "update_required", version: latest_version ?? "unknown" });
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

		const sessionState = this.identity.getSessionState();

		const result =
			sessionState.type === "identified"
				? await this.identity.refresh()
				: this.options.identifyAnonymousDevice
					? await this.identity.identify({})
					: null;

		if (!result) {
			this.logger.info("Skipping version check - not identified and identifyAnonymousDevice is false");
			return;
		}

		if (result.success) {
			this.lastCheckTime = Date.now();
			this.updateFromIdentifyResponse(result.data);
		}
	}

	public updateFromIdentifyResponse(user: IdentityUser) {
		this.updateFromVersionStatus(user.version_status);
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
		this.logger.info(`Version status: ${this.versionStatus.type} -> ${newStatus.type}`);
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
