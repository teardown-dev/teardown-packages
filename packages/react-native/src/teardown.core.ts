import { ApiClient, type ApiClientOptions } from "./clients/api";
import { DeviceClient, type DeviceClientOptions } from "./clients/device/device.client";
import { ForceUpdateClient, type ForceUpdateClientOptions } from "./clients/force-update";
import { IdentityClient } from "./clients/identity";
import { type Logger, LoggingClient, type LoggingClientOptions, LogLevel } from "./clients/logging";
import { StorageClient, type StorageClientOptions } from "./clients/storage";
import { UtilsClient } from "./clients/utils/utils.client";

export type TeardownCoreOptions = {
	logging?: LoggingClientOptions;
	api: ApiClientOptions;
	storage: StorageClientOptions;
	device: DeviceClientOptions;
	forceUpdate?: ForceUpdateClientOptions;
};

export class TeardownCore {
	private readonly logging: LoggingClient;
	private readonly logger: Logger;
	private readonly utils: UtilsClient;
	public readonly api: ApiClient;
	private readonly storage: StorageClient;
	public readonly device: DeviceClient;
	public readonly identity: IdentityClient;
	public readonly forceUpdate: ForceUpdateClient;

	constructor(private readonly options: TeardownCoreOptions) {
		this.options = options;

		this.logging = new LoggingClient(this.options.logging);
		this.setLogLevel("verbose");

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
			this.device
		);
		this.forceUpdate = new ForceUpdateClient(this.logging, this.storage, this.identity, this.options.forceUpdate)

		void this.initialize().catch((error) => {
			this.logger.error("Error initializing TeardownCore", { error });
		});

	}

	async initialize(): Promise<void> {
		await this.identity.initialize();
	}

	setLogLevel(level: LogLevel): void {
		this.logging.setLogLevel(level);
	}

	shutdown(): void {
		this.logger.info("Shutting down TeardownCore");
		this.storage.shutdown();
	}
}
