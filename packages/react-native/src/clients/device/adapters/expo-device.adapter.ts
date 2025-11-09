import {
	type ApplicationInfo,
	type DeviceType,
	type EmergencyLaunch,
	type HardwareInfo,
	type OSInfo,
	OSType,
	type UpdateInfo,
} from "@teardown/ingest-api/schemas";
import * as ExpoApplication from "expo-application";
import * as ExpoDevice from "expo-device";
import * as ExpoUpdates from "expo-updates";
import { Platform } from "react-native";
import type { DeviceInfoAdapter } from "../device.adpater-interface";

export class ExpoDeviceAdapter implements DeviceInfoAdapter {
	expoDeviceEnumToDeviceType(deviceType: ExpoDevice.DeviceType): DeviceType {
		switch (deviceType) {
			case ExpoDevice.DeviceType.PHONE:
				return "PHONE";
			case ExpoDevice.DeviceType.TABLET:
				return "TABLET";
			case ExpoDevice.DeviceType.DESKTOP:
				return "DESKTOP";
			case ExpoDevice.DeviceType.TV:
				return "TV";
			case ExpoDevice.DeviceType.UNKNOWN:
				return "UNKNOWN";
			default:
				return "UNKNOWN";
		}
	}

	get applicationInfo(): ApplicationInfo {
		if (Platform.OS === "web") {
			return {
				version: "0.0.0",
				build_number: "0",
			};
		}

		// These should never be null, as they are only null on web
		// & we are already handling that case above.
		return {
			version: ExpoApplication.nativeApplicationVersion ?? "invalid-version",
			build_number: ExpoApplication.nativeBuildVersion ?? "invalid-build-number",
		};
	}

	get emergencyLaunch(): EmergencyLaunch {
		if (!ExpoUpdates.isEmergencyLaunch) {
			return {
				is_emergency_launch: false,
			};
		}

		return {
			is_emergency_launch: true,
			reason: ExpoUpdates.emergencyLaunchReason ?? "invalid-emergency-launch-reason",
		};
	}

	get updateInfo(): UpdateInfo | null {
		return {
			is_enabled: ExpoUpdates.isEnabled ?? false,
			update_id: ExpoUpdates.updateId ?? "invalid-update-id",
			update_channel: ExpoUpdates.channel ?? "invalid-update-channel",
			runtime_version: ExpoUpdates.runtimeVersion ?? "invalid-runtime-version",
			emergency_launch: this.emergencyLaunch,
			is_embedded_launch: ExpoUpdates.isEmbeddedLaunch ?? false,
			created_at: ExpoUpdates.createdAt ?? new Date(),
		};
	}

	get hardwareInfo(): HardwareInfo {
		const deviceType = ExpoDevice.deviceType ? this.expoDeviceEnumToDeviceType(ExpoDevice.deviceType) : "UNKNOWN";

		return {
			device_name: ExpoDevice.designName ?? "Unknown",
			device_type: deviceType,
			device_brand: ExpoDevice.brand ?? "Unknown",
		};
	}

	get osInfo(): OSInfo {
		return {
			type: this.platformToOSType(),
			name: ExpoDevice.osName ?? "invalid-os-name",
			version: ExpoDevice.osVersion ?? "invalid-os-version",
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
