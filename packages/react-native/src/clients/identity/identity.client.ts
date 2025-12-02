import * as eden from "@elysiajs/eden";
import type { AsyncResult } from "@teardown/types";
import type { ApiClient } from "../api";
import type { DeviceClient } from "../device";
import type { Logger, LoggingClient } from "../logging";
import type { StorageClient, SupportedStorage } from "../storage";
import type { UtilsClient } from "../utils";
import { EventEmitter } from "eventemitter3";
import { z } from "zod";

export { eden };

export type Persona = {
	name?: string | undefined;
	user_id?: string | undefined;
	email?: string | undefined;
};

export type IdentityClientOptions = {
	/** If true, automatically identify anonymous device on load when not already identified (default: false) */
	identifyOnLoad?: boolean;
};

export type VersionStatusResponse = {
	status: "UPDATE_AVAILABLE" | "UPDATE_REQUIRED" | "UP_TO_DATE";
	latest_version?: string;
};

export type IdentityUser = {
	session_id: string;
	device_id: string;
	persona_id: string;
	token: string;
	version_status?: VersionStatusResponse;
};

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
	persona_id: z.string(),
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
	version_status: VersionStatusResponseSchema.optional(),
});

export const SessionStateSchema = z.discriminatedUnion("type", [UnidentifiedSessionStateSchema, IdentifyingSessionStateSchema, IdentifiedSessionStateSchema]);
export type SessionState = z.infer<typeof SessionStateSchema>;

export type UnidentifiedSessionState = z.infer<typeof UnidentifiedSessionStateSchema>;
export type IdentifyingSessionState = z.infer<typeof IdentifyingSessionStateSchema>;
export type IdentifiedSessionState = z.infer<typeof IdentifiedSessionStateSchema>;

export type SessionStateChangeEvents = {
	SESSION_STATE_CHANGED: (state: SessionState) => void;
};


export const SESSION_STORAGE_KEY = "SESSION_STATE";

export class IdentityClient {
	private emitter = new EventEmitter<SessionStateChangeEvents>();
	private sessionState: SessionState = { type: "unidentified" };

	public readonly logger: Logger;
	public readonly utils: UtilsClient;
	public readonly storage: SupportedStorage;

	constructor(
		logging: LoggingClient,
		utils: UtilsClient,
		storage: StorageClient,
		private readonly api: ApiClient,
		private readonly device: DeviceClient,
		private readonly options: IdentityClientOptions
	) {
		this.logger = logging.createLogger({
			name: "IdentityClient",
		});
		this.storage = storage.createStorage("identity");
		this.utils = utils;
		this.sessionState = this.getSessionStateFromStorage();

		if (this.options.identifyOnLoad && this.sessionState.type === "unidentified") {
			this.identify({});
		}
	}

	private getSessionStateFromStorage(): SessionState {
		const stored = this.storage.getItem(SESSION_STORAGE_KEY);
		if (stored == null) {
			return UnidentifiedSessionStateSchema.parse({ type: "unidentified" });
		}

		return SessionStateSchema.parse(JSON.parse(stored));
	}

	private saveSessionStateToStorage(sessionState: SessionState): void {
		this.storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionState));
	}

	private setSessionState(newState: SessionState): void {
		this.logger.info(`Session state: ${this.sessionState.type} -> ${newState.type}`);
		this.sessionState = newState;
		this.saveSessionStateToStorage(newState);
		this.emitter.emit("SESSION_STATE_CHANGED", newState);
	}

	public onSessionStateChange(listener: (state: SessionState) => void) {
		this.emitter.addListener("SESSION_STATE_CHANGED", listener);
		return () => {
			this.emitter.removeListener("SESSION_STATE_CHANGED", listener);
		};
	}

	public getSessionState(): SessionState {
		return this.sessionState;
	}

	public shutdown() {
		this.emitter.removeAllListeners("SESSION_STATE_CHANGED");
	}

	public reset() {
		this.storage.removeItem(SESSION_STORAGE_KEY);
		this.setSessionState({ type: "unidentified" });
	}

	/**
	 * Re-identify the current persona to refresh session data.
	 * Only works if already identified.
	 */
	async refresh(): AsyncResult<IdentityUser> {
		if (this.sessionState.type !== "identified") {
			return { success: false, error: "Not identified" };
		}
		return this.identify();
	}

	/**
	 * Catches all errors and returns an AsyncResult
	 * @param fn - The function to try
	 * @returns An {@link AsyncResult}
	 */
	private async tryCatch<T>(fn: () => AsyncResult<T>): AsyncResult<T> {
		try {
			const result = await fn();
			return result;
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	async identify(persona?: Persona): AsyncResult<IdentityUser> {
		const previousState = this.sessionState;
		this.setSessionState({ type: "identifying" });

		return this.tryCatch(async () => {
			const deviceId = await this.device.getDeviceId();
			const deviceInfo = await this.device.getDeviceInfo();
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
					persona,
					device: {
						...deviceInfo,
						update: deviceInfo.update
							? {
								...deviceInfo.update,
								created_at: deviceInfo.update.created_at,
							}
							: null,
					},
				},
			});

			if (response.error != null) {
				this.setSessionState(previousState);

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

			this.setSessionState({
				type: "identified",
				session: response.data.data,
				version_status: response.data.data.version_status,
			});

			return {
				success: true,
				data: response.data.data,
			};
		});
	}
}
