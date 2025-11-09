import {
	type ApplicationInfo,
	type HardwareInfo,
	type OSInfo,
	OSType,
	type UpdateInfo,
} from "@teardown/ingest-api/schemas";
import { Platform } from "react-native";
import DeviceInfo from "react-native-device-info";
import type { DeviceInfoAdapter } from "../device.adpater-interface";

export class RNDeviceInfoAdapter implements DeviceInfoAdapter {
	get applicationInfo(): ApplicationInfo {
		return {
			version: DeviceInfo.getVersion(),
			build_number: DeviceInfo.getBuildNumber(),
		};
	}

	get updateInfo(): UpdateInfo | null {
		return null;
	}

	get hardwareInfo(): HardwareInfo {
		return {
			device_name: DeviceInfo.getDeviceNameSync(),
			device_type: DeviceInfo.getDeviceType(),
			device_brand: DeviceInfo.getBrand(),
		};
	}

	get osInfo(): OSInfo {
		return {
			type: this.platformToOSType(),
			name: DeviceInfo.getSystemName(),
			version: DeviceInfo.getSystemVersion(),
		};
	}

	public platformToOSType(): OSType {
		const platform = Platform.OS;
		switch (platform) {
			case "ios":
				return OSType.IOS;
			case "android":
				return OSType.ANDROID;
			case "web":
				return OSType.WEB;
			case "windows":
				return OSType.WINDOWS;
			case "macos":
				return OSType.MACOS;
			default:
				throw new Error(`Unsupported platform: ${platform}`);
		}
	}
}
