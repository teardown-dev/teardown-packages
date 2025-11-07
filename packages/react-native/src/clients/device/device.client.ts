import type { Logger, LoggingClient } from "../logging/";
import type { StorageClient, SupportedStorage } from "../storage";
import type { UtilsClient } from "../utils/utils.client";

export class DeviceClient {
	private logger: Logger;
	private storage: SupportedStorage;

	constructor(
		logging: LoggingClient,
		private readonly utils: UtilsClient,
		storage: StorageClient
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
}
