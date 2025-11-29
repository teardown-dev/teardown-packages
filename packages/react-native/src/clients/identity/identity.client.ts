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
	storage: StorageClient;
};

export type IdentityUser = {
	session_id: string;
	device_id: string;
	persona_id: string;
	token: string;
};


export const UnidentifiedPersonaStateSchema = z.object({
	type: z.literal("unidentified"),
});
export const IdentifyingPersonaStateSchema = z.object({
	type: z.literal("identifying"),
});
export const IdentifiedPersonaStateSchema = z.object({
	type: z.literal("identified"),
	persona: z.object({
		name: z.string().optional(),
		user_id: z.string().optional(),
		email: z.string().optional(),
	}),
});

export type UnidentifiedPersonaState = z.infer<typeof UnidentifiedPersonaStateSchema>;
export type IdentifyingPersonaState = z.infer<typeof IdentifyingPersonaStateSchema>;
export type IdentifiedPersonaState = z.infer<typeof IdentifiedPersonaStateSchema>;

export type PersonaState =
	| UnidentifiedPersonaState
	| IdentifyingPersonaState
	| IdentifiedPersonaState;

export type PersonaStateChangeEvents = {
	PERSONA_STATE_CHANGED: (state: PersonaState) => void;
};


export const PERSONA_STORAGE_KEY = "PERSONA_STATE";

export class IdentityClient {
	private emitter = new EventEmitter<PersonaStateChangeEvents>();
	private personaState: PersonaState = { type: "unidentified" };

	public readonly logger: Logger;
	public readonly utils: UtilsClient;
	public readonly storage: SupportedStorage;

	private _persona: Persona | null = null;

	constructor(
		logging: LoggingClient,
		utils: UtilsClient,
		storage: StorageClient,
		private readonly api: ApiClient,
		private readonly device: DeviceClient,
		_options: IdentityClientOptions
	) {
		this.logger = logging.createLogger({
			name: "IdentityClient",
		});
		this.storage = storage.createStorage("identity");
		this.utils = utils;
		this.personaState = this.getPersonaStateFromStorage();
	}

	private getPersonaStateFromStorage(): PersonaState {
		const stored = this.storage.getItem(PERSONA_STORAGE_KEY);
		if (stored == null) {
			return UnidentifiedPersonaStateSchema.parse({ type: "unidentified" });
		}

		return IdentifiedPersonaStateSchema.parse(JSON.parse(stored));
	}

	private savePersonaStateToStorage(personaState: PersonaState): void {
		this.storage.setItem(PERSONA_STORAGE_KEY, JSON.stringify(personaState));
	}

	private getPersona(): Persona | null {
		if (this._persona != null) {
			return this._persona;
		}

		const stored = this.storage.getItem("persona");
		if (stored == null) {
			return null;
		}

		const persona = JSON.parse(stored) as Persona;
		this._persona = persona;
		return persona;
	}

	private setPersona(newState: PersonaState): void {
		this.logger.info(`Persona state: ${this.personaState.type} -> ${newState.type}`);
		this.personaState = newState;
		this.savePersonaStateToStorage(newState);
		this.emitter.emit("PERSONA_STATE_CHANGED", newState);
	}

	public onPersonaStateChange(listener: (state: PersonaState) => void) {
		this.emitter.addListener("PERSONA_STATE_CHANGED", listener);
		return () => {
			this.emitter.removeListener("PERSONA_STATE_CHANGED", listener);
		};
	}

	public getPersonaState(): PersonaState {
		return this.personaState;
	}

	public shutdown() {
		this.emitter.removeAllListeners("PERSONA_STATE_CHANGED");
	}

	public reset() {
		this._persona = null;
		this.storage.removeItem("persona");
		this.setPersona({ type: "unidentified" });
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

	async identify(persona: Persona): AsyncResult<IdentityUser> {
		const previousState = this.personaState;
		this.setPersona({ type: "identifying" });

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
					device: deviceInfo,
				},
			});

			if (response.error != null) {
				this.setPersona(previousState);

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

			this.setPersona({ type: "identified", persona });

			return {
				success: true,
				data: response.data.data,
			};
		});
	}
}
