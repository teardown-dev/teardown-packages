import { NotificationPlatform, type DeviceInfo } from "@teardown/ingest-api/schemas";
import { DevicePlatformEnum } from "@teardown/ingest-api/vendored/consts";
import type { Logger, LoggingClient } from "../logging/";
import type { StorageClient, SupportedStorage } from "../storage";
import type { UtilsClient } from "../utils/utils.client";
import type { DeviceInfoAdapter } from "./device.adpater-interface";

export type DeviceClientOptions = {
	adapter: DeviceInfoAdapter;
};
export class DeviceClient {
	private logger: Logger;
	private storage: SupportedStorage;

	constructor(
		logging: LoggingClient,
		private readonly utils: UtilsClient,
		storage: StorageClient,
		_options: DeviceClientOptions
	) {
		this.logger = logging.createLogger({
			name: "DeviceClient",
		});
		this.storage = storage.createStorage("device");
	}

	async getDeviceId(): Promise<string> {

		this.logger.debug("Getting device ID");
		const deviceId = this.storage.getItem("deviceId");
		if (deviceId) {
			return deviceId;
		}

		const newDeviceId = await this.utils.generateRandomUUID();
		this.storage.setItem("deviceId", newDeviceId);
		this.logger.debug(`Device ID generated: ${newDeviceId}`);

		return newDeviceId;
	}

	async getDeviceInfo(): Promise<DeviceInfo> {
		return {
			application: {
				version: "1.0.0",
				build_number: "1",
			},
			update: {
				is_enabled: true,
				update_id: "1234567890",
				update_channel: "production",
				runtime_version: "1.0.0",
				emergency_launch: {
					is_emergency_launch: false,
					reason: undefined,
				},
				is_embedded_launch: false,
				created_at: new Date(),
			},
			hardware: {
				device_name: "iPhone 13",
				device_brand: "Apple",
				device_type: "ios",
			},
			os: {
				platform: DevicePlatformEnum.IOS,
				name: "iOS",
				version: "15.0",
			},
			notifications: {
				push: {
					platform: NotificationPlatform.EXPO,
					enabled: true,
					granted: true,
					token: "1234567890",
				},
			},
		};
	}
}
