import { ApiClient, type ApiClientOptions } from "./clients/api";
import { DeviceClient, type DeviceClientOptions } from "./clients/device";
import { IdentityClient, type IdentityClientOptions } from "./clients/identity";
import { type Logger, LoggingClient } from "./clients/logging";
import { StorageClient, type StorageClientOptions } from "./clients/storage";
import { UpdateClient } from "./clients/updates/update.client";
import { UtilsClient } from "./clients/utils/utils.client";

export type TeardownCoreOptions = {
	api: ApiClientOptions;
	storage: StorageClientOptions;
	identity: IdentityClientOptions;
	device: DeviceClientOptions;
};

export class TeardownCore {
	private readonly logging: LoggingClient;
	private readonly logger: Logger;
	private readonly utils: UtilsClient;
	public readonly api: ApiClient;
	private readonly storage: StorageClient;
	public readonly device: DeviceClient;
	public readonly identity: IdentityClient;
	public readonly update: UpdateClient;

	constructor(private readonly options: TeardownCoreOptions) {
		this.options = options;

		this.logging = new LoggingClient();
		this.logger = this.logging.createLogger({
			name: "TeardownCore",
		});
		this.utils = new UtilsClient(this.logging);
		this.storage = new StorageClient(this.logging, this.options.storage);
		this.api = new ApiClient(this.logging, this.storage, this.options.api);
		this.device = new DeviceClient(this.logging, this.utils, this.storage, this.options.device);
		this.identity = new IdentityClient(
			this.logging,
			this.utils,
			this.storage,
			this.api,
			this.device,
			this.options.identity
		);
		this.update = new UpdateClient(this.logging)
	}


	shutdown(): void {
		this.logger.info("Shutting down TeardownCore");
		this.storage.shutdown();
	}
}
