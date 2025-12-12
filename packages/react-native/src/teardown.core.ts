import { ApiClient } from "./clients/api";
import { DeviceClient, type DeviceClientOptions } from "./clients/device/device.client";
import { ForceUpdateClient, type ForceUpdateClientOptions } from "./clients/force-update";
import { IdentityClient } from "./clients/identity";
import { LoggingClient, type LogLevel, type Logger } from "./clients/logging";
import { StorageClient, type StorageAdapter } from "./clients/storage";
import { UtilsClient } from "./clients/utils/utils.client";

export type TeardownCoreOptions = {
	org_id: string;
	project_id: string;
	api_key: string;
	// environment_slug: string; // TODO: add this back in
	storageAdapter: StorageAdapter;
	deviceAdapter: DeviceClientOptions["adapter"];
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

		this.logging = new LoggingClient();
		this.setLogLevel("verbose");

		this.logger = this.logging.createLogger({
			name: "TeardownCore",
		});
		this.utils = new UtilsClient(this.logging);
		this.storage = new StorageClient(
			this.logging,
			this.options.org_id,
			this.options.project_id,
			this.options.storageAdapter
		);
		this.api = new ApiClient(this.logging, this.storage, {
			org_id: this.options.org_id,
			project_id: this.options.project_id,
			api_key: this.options.api_key,
			environment_slug: "production",
		});
		this.device = new DeviceClient(this.logging, this.utils, this.storage, {
			adapter: this.options.deviceAdapter,
		});
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
		}).then(() => {
			this.logger.debug("TeardownCore initialized");
		});

	}

	async initialize(): Promise<void> {
		// Wait for all storage hydration to complete
		await this.storage.whenReady();
		// Initialize identity (loads from storage, then identifies if needed)
		await this.identity.initialize();
		// Then initialize force update (subscribes to identity events)
		this.forceUpdate.initialize();
	}

	setLogLevel(level: LogLevel): void {
		this.logging.setLogLevel(level);
	}

	shutdown(): void {
		this.logger.debug("Shutting down TeardownCore");
		this.storage.shutdown();
	}
}
