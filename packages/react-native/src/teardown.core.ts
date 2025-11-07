import { ApiClient, type ApiClientOptions } from "./clients/api";
import { DeviceClient } from "./clients/device";
import { LoggingClient } from "./clients/logging";
import { StorageClient, type StorageClientOptions } from "./clients/storage";
import { UtilsClient } from "./clients/utils/utils.client";

export type TeardownCoreOptions = {
	api: ApiClientOptions;
	storage: StorageClientOptions;
};

export class TeardownCore {
	private readonly logging: LoggingClient;
	private readonly utils: UtilsClient;
	public readonly api: ApiClient;
	private readonly storage: StorageClient;
	public readonly device: DeviceClient;

	constructor(private readonly options: TeardownCoreOptions) {
		this.options = options;

		this.logging = new LoggingClient();
		this.utils = new UtilsClient(this.logging);
		this.storage = new StorageClient(this.logging, this.options.storage);
		this.api = new ApiClient(this.logging, this.storage, this.options.api);
		this.device = new DeviceClient(this.logging, this.utils, this.storage);
	}

}
