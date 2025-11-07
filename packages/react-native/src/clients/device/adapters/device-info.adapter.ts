import type { ApplicationInfo, HardwareInfo, OSInfo } from "@teardown/schemas";
import { Platform } from "react-native";
import DeviceInfo from "react-native-device-info";
import { DeviceInfoAdapter as BaseInfoAdapterInterface } from "./device.adpater-interface";

export class DeviceInfoAdapter extends BaseInfoAdapterInterface {
	get applicationInfo(): ApplicationInfo {
		return {
			version: DeviceInfo.getVersion() ?? "0.0.0",
			build_number: Number.parseInt(DeviceInfo.getBuildNumber() ?? "0", 10),
		};
	}

	get hardwareInfo(): HardwareInfo {
		return {
			device_name: DeviceInfo.getDeviceNameSync() ?? "Unknown Device",
			device_brand: DeviceInfo.getBrand() ?? "Unknown Brand",
			device_type: DeviceInfo.getDeviceType?.() ?? "unknown",
		};
	}

	get osInfo(): OSInfo {
		return {
			platform: this.mapPlatform(Platform.OS),
			name: DeviceInfo.getSystemName() ?? Platform.OS,
			version: DeviceInfo.getSystemVersion() ?? "0.0.0",
		};
	}
}
