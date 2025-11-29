import { EventEmitter } from "eventemitter3";
import { z } from "zod";
import type { IdentityClient, IdentityUser } from "../identity";
import type { Logger, LoggingClient } from "../logging";
import type { StorageClient, SupportedStorage } from "../storage";

export const UnknownVersionStatusSchema = z.object({ type: z.literal("unknown") });
export const CheckingVersionStatusSchema = z.object({ type: z.literal("checking") });
export const UpToDateVersionStatusSchema = z.object({ type: z.literal("up_to_date") });
export const UpdateAvailableVersionStatusSchema = z.object({ type: z.literal("update_available"), version: z.string() });
export const UpdateRequiredVersionStatusSchema = z.object({ type: z.literal("update_required"), version: z.string() });

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

export const VERSION_STATUS_STORAGE_KEY = "VERSION_STATUS";

export class ForceUpdateClient {
	private emitter = new EventEmitter<VersionStatusChangeEvents>();
	private versionStatus: VersionStatus = { type: "unknown" };
	private unsubscribe: (() => void) | null = null;

	private readonly logger: Logger;
	private readonly storage: SupportedStorage;

	constructor(
		logging: LoggingClient,
		storage: StorageClient,
		private readonly identity: IdentityClient
	) {
		this.logger = logging.createLogger({ name: "ForceUpdateClient" });
		this.storage = storage.createStorage("version");
		this.versionStatus = this.getVersionStatusFromStorage();
		this.subscribeToIdentity();
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
		this.unsubscribe = this.identity.onPersonaStateChange((state) => {
			if (state.type === "identifying") {
				this.setVersionStatus({ type: "checking" });
			}
		});
	}

	public updateFromIdentifyResponse(user: IdentityUser) {
		if (!user.version_status) {
			this.setVersionStatus({ type: "up_to_date" });
			return;
		}

		const { status, latest_version } = user.version_status;
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
		this.emitter.removeAllListeners("VERSION_STATUS_CHANGED");
	}
}
