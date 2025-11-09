import type { DeviceInfo } from "@teardown/ingest-api/schemas";
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
			application: this.options.adapter.applicationInfo,
			update: this.options.adapter.updateInfo,
			hardware: this.options.adapter.hardwareInfo,
			os: this.options.adapter.osInfo,
		};
	}
}
