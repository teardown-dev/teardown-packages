import {
	DevicePlatformEnum,
	type ApplicationInfo,
	type DeviceInfo,
	type HardwareInfo,
	type OSInfo
} from "@teardown/schemas";
import { Platform } from "react-native";

/**
 * An interface for a device adapter.
 * This interface is used to abstract the device adapter implementation.
 * Everything is optional and should be implemented by the adapter.
 *
 * The aim of this interface is to provide a consistent way to get information about the device.
 * With an opt-in approach to get the information your want to use and track.
 *
 */
export abstract class DeviceInfoAdapter {
	/**
	 * The information about the application running.
	 */
	abstract get applicationInfo(): ApplicationInfo;
	/**
	 * The information about the hardware of the device.
	 */
	abstract get hardwareInfo(): HardwareInfo;
	/**
	 * The information about the operating system of the device.
	 */
	abstract get osInfo(): OSInfo;
	/**
	 * The information about the device.
	 */
	public getDeviceInfo(): Promise<DeviceInfo> {
		return Promise.resolve({
			application: this.applicationInfo,
			hardware: this.hardwareInfo,
			os: this.osInfo,
			notifications: null,
			update: null,
		});
	}

	/**
	 * Maps React Native Platform.OS to DevicePlatformEnum
	 */
	mapPlatform(platform: typeof Platform.OS): DevicePlatformEnum {
		switch (platform) {
			case "ios":
				return DevicePlatformEnum.IOS;
			case "android":
				return DevicePlatformEnum.ANDROID;
			case "web":
				return DevicePlatformEnum.WEB;
			case "macos":
				return DevicePlatformEnum.MACOS;
			case "windows":
				return DevicePlatformEnum.WINDOWS;
			default:
				return DevicePlatformEnum.UNKNOWN;
		}
	}

}
