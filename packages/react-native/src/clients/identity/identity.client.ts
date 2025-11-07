import type { AsyncResult } from "@teardown/types";
import { EventEmitter } from "eventemitter3";
import { z } from "zod";
import type { ApiClient } from "../api";
import type { DeviceClient } from "../device/device.client";
import { IdentifyVersionStatusEnum } from "../force-update";
import type { Logger, LoggingClient } from "../logging";
import type { StorageClient, SupportedStorage } from "../storage";
import type { UtilsClient } from "../utils";

export interface Persona {
	name?: string | undefined;
	user_id?: string | undefined;
	email?: string | undefined;
}

export interface IdentityUser {
	session_id: string;
	device_id: string;
	user_id: string;
	token: string;
	version_info: {
		status: IdentifyVersionStatusEnum;
		update: null;
	};
}

export const UnidentifiedSessionStateSchema = z.object({
	type: z.literal("unidentified"),
});
export const IdentifyingSessionStateSchema = z.object({
	type: z.literal("identifying"),
});

export const UpdateVersionStatusBodySchema = z.object({
	version: z.string(),
});

export const SessionSchema = z.object({
	session_id: z.string(),
	device_id: z.string(),
	user_id: z.string().or(z.object({ persona_id: z.string() }).transform((val) => val.persona_id)),
	token: z.string(),
});
export type Session = z.infer<typeof SessionSchema>;

export const VersionStatusResponseSchema = z.object({
	status: z.enum(["UPDATE_AVAILABLE", "UPDATE_REQUIRED", "UP_TO_DATE"]),
	latest_version: z.string().optional(),
});

export const IdentifiedSessionStateSchema = z.object({
	type: z.literal("identified"),
	session: SessionSchema,
	version_info: z.object({
		status: z.enum(IdentifyVersionStatusEnum),
		update: z.null(),
	}),
});

export const IdentifyStateSchema = z.discriminatedUnion("type", [
	UnidentifiedSessionStateSchema,
	IdentifyingSessionStateSchema,
	IdentifiedSessionStateSchema,
]);
export type IdentifyState = z.infer<typeof IdentifyStateSchema>;

export type UnidentifiedSessionState = z.infer<typeof UnidentifiedSessionStateSchema>;
export type IdentifyingSessionState = z.infer<typeof IdentifyingSessionStateSchema>;
export type IdentifiedSessionState = z.infer<typeof IdentifiedSessionStateSchema>;

export interface IdentifyStateChangeEvents {
	IDENTIFY_STATE_CHANGED: (state: IdentifyState) => void;
}

export const IDENTIFY_STORAGE_KEY = "IDENTIFY_STATE";

export class IdentityClient {
	private emitter = new EventEmitter<IdentifyStateChangeEvents>();
	private identifyState: IdentifyState = { type: "unidentified" };
	private initialized = false;

	public readonly logger: Logger;
	public readonly utils: UtilsClient;
	public readonly storage: SupportedStorage;

	constructor(
		logging: LoggingClient,
		utils: UtilsClient,
		storage: StorageClient,
		private readonly api: ApiClient,
		private readonly device: DeviceClient
	) {
		this.logger = logging.createLogger({
			name: "IdentityClient",
		});
		this.storage = storage.createStorage("identity");
		this.utils = utils;
		// Don't load from storage here - defer to initialize()
	}

	async initialize(): Promise<void> {
		this.logger.debug("Initializing IdentityClient");
		if (this.initialized) {
			this.logger.debug("IdentityClient already initialized");
			return;
		}
		this.initialized = true;

		try {
			// Load state from storage first (for fallback if identify fails)
			this.identifyState = this.getIdentifyStateFromStorage();
			this.logger.debug(`Initialized with state: ${this.identifyState.type}`);
		} catch (error) {
			// Silently fail on errors - we'll re-identify on app boot if needed
			this.logger.debugError("Error initializing IdentityClient", { error });
			this.identifyState = { type: "unidentified" };
		}

		// Always identify on app boot to refresh version status
		await this.identify();
	}

	private getIdentifyStateFromStorage(): IdentifyState {
		try {
			const stored = this.storage.getItem(IDENTIFY_STORAGE_KEY);

			if (stored == null) {
				this.logger.debugInfo("No stored identity state, returning unidentified");
				return UnidentifiedSessionStateSchema.parse({ type: "unidentified" });
			}

			const parsed = IdentifyStateSchema.parse(JSON.parse(stored));
			this.logger.debugInfo(`Parsed identity state from storage: ${parsed.type}`);

			// "identifying" is a transient state - if we restore it, treat as unidentified
			// This can happen if the app was killed during an identify call
			if (parsed.type === "identifying") {
				this.logger.debugInfo("Found stale 'identifying' state in storage, resetting to unidentified");
				// Clear the stale state from storage immediately
				this.storage.removeItem(IDENTIFY_STORAGE_KEY);
				return UnidentifiedSessionStateSchema.parse({ type: "unidentified" });
			}

			return parsed;
		} catch (error) {
			this.logger.debugError("Error getting identify state from storage", { error });
			return { type: "unidentified" };
		}
	}

	private saveIdentifyStateToStorage(identifyState: IdentifyState): void {
		this.storage.setItem(IDENTIFY_STORAGE_KEY, JSON.stringify(identifyState));
	}

	private setIdentifyState(newState: IdentifyState): void {
		if (this.identifyState.type === newState.type) {
			this.logger.debugInfo(`Identify state already set: ${this.identifyState.type}`);
			return;
		}

		this.logger.debugInfo(`Identify state: ${this.identifyState.type} -> ${newState.type}`);
		this.identifyState = newState;
		this.saveIdentifyStateToStorage(newState);
		this.emitter.emit("IDENTIFY_STATE_CHANGED", newState);
	}

	public onIdentifyStateChange(listener: (state: IdentifyState) => void) {
		this.emitter.addListener("IDENTIFY_STATE_CHANGED", listener);
		return () => {
			this.emitter.removeListener("IDENTIFY_STATE_CHANGED", listener);
		};
	}

	public getIdentifyState(): IdentifyState {
		return this.identifyState;
	}

	public getSessionState(): Session | null {
		if (this.identifyState.type !== "identified") {
			return null;
		}
		return this.identifyState.session;
	}

	public shutdown() {
		this.emitter.removeAllListeners("IDENTIFY_STATE_CHANGED");
	}

	public reset() {
		this.storage.removeItem(IDENTIFY_STORAGE_KEY);
		this.setIdentifyState({ type: "unidentified" });
	}

	/**
	 * Re-identify the current persona to refresh session data.
	 * Only works if already identified.
	 */
	async refresh(): AsyncResult<IdentityUser> {
		if (this.identifyState.type !== "identified") {
			return { success: false, error: "Not identified" };
		}
		return this.identify();
	}

	/**
	 * Catches all errors and returns an AsyncResult
	 * @param fn - The function to try
	 * @returns An {@link AsyncResult}
	 */
	private async tryCatch<T>(fn: () => AsyncResult<T>, onError?: (error: Error) => void): AsyncResult<T> {
		try {
			const result = await fn();
			return result;
		} catch (error) {
			if (onError) {
				onError(error instanceof Error ? error : new Error(String(error)));
			}
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	async identify(user?: Persona): AsyncResult<IdentityUser> {
		this.logger.debugInfo(`Identifying user with persona: ${user?.name ?? "none"}`);
		const previousState = this.identifyState;
		this.setIdentifyState({ type: "identifying" });

		return this.tryCatch(
			async () => {
				this.logger.debug("Getting device ID...");
				const deviceId = await this.device.getDeviceId();
				const deviceInfo = await this.device.getDeviceInfo();
				this.logger.debug("Calling identify API...");
				const response = await this.api.client("/v1/identify", {
					method: "POST",
					headers: {
						"td-api-key": this.api.apiKey,
						"td-org-id": this.api.orgId,
						"td-project-id": this.api.projectId,
						"td-environment-slug": "production",
						"td-device-id": deviceId,
					},
					body: {
						user,
						device: {
							timestamp: deviceInfo.timestamp,
							os: deviceInfo.os,
							application: deviceInfo.application,
							hardware: deviceInfo.hardware,
							update: null,
						},
					},
				});

				this.logger.debugInfo(`Identify API response received`);
				if (response.error != null) {
					this.logger.warn("Identify API error", response.error.status, response.error.value);
					this.setIdentifyState(previousState);

					if (response.error.status === 422) {
						this.logger.warn("422 Error identifying user", response.error.value);
						return {
							success: false,
							error: response.error.value.message ?? "Unknown error",
						};
					}

					const value = response.error.value;
					return {
						success: false,
						error: value?.error?.message ?? "Unknown error",
					};
				}

				this.setIdentifyState({
					type: "identified",
					session: response.data.data,
					version_info: {
						status: response.data.data.version_info.status,
						update: null,
					},
				});

				return {
					success: true,
					data: {
						...response.data.data,
						version_info: {
							status: response.data.data.version_info.status,
							update: null,
						},
					},
				};
			},
			(error) => {
				this.logger.error("Error identifying user", error);
				this.setIdentifyState(previousState);
				return {
					success: false,
					error: error.message,
				};
			}
		);
	}
}
