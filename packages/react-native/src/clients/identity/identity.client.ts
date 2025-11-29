import * as eden from "@elysiajs/eden";
import type { AsyncResult } from "@teardown/types";
import type { ApiClient } from "../api";
import type { DeviceClient } from "../device";
import type { Logger, LoggingClient } from "../logging";
import type { StorageClient, SupportedStorage } from "../storage";
import type { UtilsClient } from "../utils";
import { EventEmitter } from "eventemitter3";


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

export type UnidentifiedPersonaState = { type: "unidentified" };
export type IdentifyingPersonaState = { type: "identifying" };
export type IdentifiedPersonaState = { type: "identified"; persona: Persona };

export type PersonaState =
	| UnidentifiedPersonaState
	| IdentifyingPersonaState
	| IdentifiedPersonaState;

export type PersonaStateChangeEvents = {
	PERSONA_STATE_CHANGED: (state: PersonaState) => void;
};

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
	}

	private async getPersona(): Promise<Persona> {
		if (this._persona != null) {
			return this._persona;
		}

		const persona = await this.storage.getItem("persona");
		this._persona = persona;
		return persona;
	}

	private async setPersona(persona: Persona): Promise<void> {
		this._persona = persona;
		await this.storage.setItem("persona", persona);
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

	private setPersonaState(newState: PersonaState) {
		this.logger.info(`Persona state: ${this.personaState.type} -> ${newState.type}`);
		this.personaState = newState;
		this.emitter.emit("PERSONA_STATE_CHANGED", newState);
	}

	public shutdown() {
		this.emitter.removeAllListeners("PERSONA_STATE_CHANGED");
	}

	public async reset() {
		this._persona = null;
		await this.storage.removeItem("persona");
		this.setPersonaState({ type: "unidentified" });
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
		this.setPersonaState({ type: "identifying" });

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
				this.setPersonaState(previousState);

				if (response.error.status === 422) {
					console.warn("422 Error identifying user", response.error.value);
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

			await this.setPersona(persona);
			this.setPersonaState({ type: "identified", persona });

			return {
				success: true,
				data: response.data.data,
			};
		});
	}
}
