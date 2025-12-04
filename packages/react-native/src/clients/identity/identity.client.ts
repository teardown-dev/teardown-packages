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
	persona_id: string;
	token: string;
	version_info: {
		status: IdentifyVersionStatusEnum;
		update: null
	}
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
	version_info: z.object({
		status: z.enum(IdentifyVersionStatusEnum),
		update: z.null(),
	}),
});

export const IdentifyStateSchema = z.discriminatedUnion("type", [UnidentifiedSessionStateSchema, IdentifyingSessionStateSchema, IdentifiedSessionStateSchema]);
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
	private identifyState: IdentifyState;

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
		this.identifyState = this.getIdentifyStateFromStorage();
	}

	async initialize(): Promise<void> {
		await this.identify();
	}

	private getIdentifyStateFromStorage(): IdentifyState {
		const stored = this.storage.getItem(IDENTIFY_STORAGE_KEY);
		if (stored == null) {
			// console.log("no stored session state");
			return UnidentifiedSessionStateSchema.parse({ type: "unidentified" });
		}

		// console.log("stored session state", stored);
		return IdentifyStateSchema.parse(JSON.parse(stored));
	}

	private saveIdentifyStateToStorage(identifyState: IdentifyState): void {
		this.storage.setItem(IDENTIFY_STORAGE_KEY, JSON.stringify(identifyState));
	}

	private setIdentifyState(newState: IdentifyState): void {
		this.logger.info(`Identify state: ${this.identifyState.type} -> ${newState.type}`);
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
		const previousState = this.identifyState;
		this.setIdentifyState({ type: "identifying" });

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
		});
	}
}
