import * as eden from "@elysiajs/eden";
import type { AsyncResult } from "@teardown/types";
import type { ApiClient } from "../api";
import type { DeviceClient } from "../device";
import type { Logger, LoggingClient } from "../logging";
import type { StorageClient, SupportedStorage } from "../storage";
import type { UtilsClient } from "../utils";
import type { EventEmitter } from "eventemitter3";


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

export class IdentityClient {

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

			return {
				success: true,
				data: response.data.data,
			};
		});
	}
}
