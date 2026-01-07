import { ApiClient } from "./clients/api";
import { DeviceClient, type DeviceClientOptions } from "./clients/device/device.client";
import { EventsClient } from "./clients/events";
import { ForceUpdateClient, type ForceUpdateClientOptions } from "./clients/force-update";
import { IdentityClient } from "./clients/identity";
import { type Logger, LoggingClient, type LogLevel } from "./clients/logging";
import type { NotificationAdapter } from "./clients/notifications/adapters/notifications.adapter-interface";
import { NotificationsClient } from "./clients/notifications/notifications.client";
import { type StorageAdapter, StorageClient } from "./clients/storage";
import { UtilsClient } from "./clients/utils/utils.client";

export type TeardownCoreOptions = {
	org_id: string;
	project_id: string;
	api_key: string;
	/** Environment slug (e.g. "production", "staging", "development") */
	environment_slug?: string;
	/** Custom ingest API URL for local/staging environments */
	ingestUrl?: string;
	storageAdapter: StorageAdapter;
	deviceAdapter: DeviceClientOptions["adapter"];
	forceUpdate?: ForceUpdateClientOptions;
	/** Optional notification adapter for push notification support */
	notificationAdapter?: NotificationAdapter;
};

export class TeardownCore {
	private readonly logging: LoggingClient;
	private readonly logger: Logger;
	private readonly utils: UtilsClient;
	public readonly api: ApiClient;
	private readonly storage: StorageClient;
	public readonly device: DeviceClient;
	public readonly events: EventsClient;
	public readonly identity: IdentityClient;
	public readonly forceUpdate: ForceUpdateClient;
	public readonly notifications?: NotificationsClient;

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
			environment_slug: this.options.environment_slug ?? "production",
			ingestUrl: this.options.ingestUrl,
		});
		this.device = new DeviceClient(this.logging, this.utils, this.storage, {
			adapter: this.options.deviceAdapter,
		});

		// Create events client after device (needs device for deviceId)
		this.events = new EventsClient(this.logging, this.api, this.device);

		// Create notifications client before identity so it can be passed in
		if (this.options.notificationAdapter) {
			this.notifications = new NotificationsClient(this.logging, this.storage, {
				adapter: this.options.notificationAdapter,
			});
		}

		this.identity = new IdentityClient(
			this.logging,
			this.utils,
			this.storage,
			this.api,
			this.device,
			this.events,
			this.notifications
		);
		this.forceUpdate = new ForceUpdateClient(this.logging, this.storage, this.identity, this.options.forceUpdate);

		void this.initialize()
			.catch((error) => {
				this.logger.error("Error initializing TeardownCore", { error });
			})
			.then(() => {
				this.logger.debug("TeardownCore initialized");
			});
	}

	async initialize(): Promise<void> {
		// Wait for all storage hydration to complete
		this.logger.debug("Waiting for storage to be ready");
		await this.storage.whenReady();

		// Initialize notifications first so token is available for identify
		if (this.notifications) {
			this.logger.debug("Initializing notifications");
			await this.notifications.initialize();
			this.logger.debug("Notifications initialized");
		}

		// Initialize identity (loads from storage, then identifies if needed)
		this.logger.debug("Initializing identity");
		await this.identity.initialize();
		this.logger.debug("Identity initialized");

		// Then initialize force update (subscribes to identity events)
		this.logger.debug("Initializing force update");
		this.forceUpdate.initialize();
		this.logger.debug("Force update initialized");
	}

	setLogLevel(level: LogLevel): void {
		this.logging.setLogLevel(level);
	}

	shutdown(): void {
		this.logger.debug("Shutting down TeardownCore");
	}
}
