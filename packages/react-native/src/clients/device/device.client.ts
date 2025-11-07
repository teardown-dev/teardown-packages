import type { DeviceInfo } from "@teardown/schemas";
import type { Logger, LoggingClient } from "../logging/";
import type { StorageClient, SupportedStorage } from "../storage";
import type { UtilsClient } from "../utils/utils.client";
import type { DeviceInfoAdapter } from "./adapters/device.adpater-interface";

// TODO: sort out why importing these enuims from schemas is not working - @teardown/schemas
export enum NotificationPlatformEnum {
	APNS = "APNS", // Apple Push Notification Service
	FCM = "FCM", // Firebase Cloud Messaging
	EXPO = "EXPO", // Expo Push Notifications
}

// TODO: sort out why importing these enuims from schemas is not working - @teardown/schemas
export enum DevicePlatformEnum {
	IOS = "IOS",
	ANDROID = "ANDROID",
	WEB = "WEB",
	WINDOWS = "WINDOWS",
	MACOS = "MACOS",
	LINUX = "LINUX",
	PHONE = "PHONE",
	TABLET = "TABLET",
	DESKTOP = "DESKTOP",
	CONSOLE = "CONSOLE",
	TV = "TV",
	WEARABLE = "WEARABLE",
	GAME_CONSOLE = "GAME_CONSOLE",
	VR = "VR",
	UNKNOWN = "UNKNOWN",
	OTHER = "OTHER",
}

export interface DeviceClientOptions {
	adapter: DeviceInfoAdapter;
}
export class DeviceClient {
	private logger: Logger;
	private storage: SupportedStorage;

	constructor(
		logging: LoggingClient,
		private readonly utils: UtilsClient,
		storage: StorageClient,
		private readonly options: DeviceClientOptions
	) {
		this.logger = logging.createLogger({
			name: "DeviceClient",
		});
		this.storage = storage.createStorage("device");
	}

	async getDeviceId(): Promise<string> {
		this.logger.debug("Getting device ID");
		const deviceId = this.storage.getItem("deviceId");
		this.logger.debug(`Device ID found in storage: ${deviceId}`);
		if (deviceId) {
			return deviceId;
		}

		const newDeviceId = await this.utils.generateRandomUUID();
		await this.storage.setItem("deviceId", newDeviceId);

		return newDeviceId;
	}

	async getDeviceInfo(): Promise<DeviceInfo> {
		return this.options.adapter.getDeviceInfo();
	}
}
