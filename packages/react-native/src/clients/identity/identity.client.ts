import * as eden from "@elysiajs/eden";
import type { ApiClient } from "../api";
import type { DeviceClient } from "../device";
import type { Logger, LoggingClient } from "../logging";
import type { StorageClient, SupportedStorage } from "../storage";
import type { UtilsClient } from "../utils";

export { eden };

export type Persona = {
	name?: string | undefined;
	user_id?: string | undefined;
	email?: string | undefined;
};

export type IdentityClientOptions = {
	storage: StorageClient;
};

export type IdentityUser = {};

export class IdentityClient {
	public readonly logger: Logger;
	public readonly utils: UtilsClient;
	public readonly storage: SupportedStorage;

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

	async identify(persona: Persona) {
		const device = await this.device.getDeviceInfo();

		const response = await this.api.fetch("/v1/identify", {
			method: "POST",
			body: {
				persona,
				device,
			},
		});

		if (!response?.data) {
			throw new Error(`Failed to identify: ${response?.error?.message}`);
		}

		return response?.data;
	}
}
