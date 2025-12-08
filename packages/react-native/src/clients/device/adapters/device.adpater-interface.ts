import type {
	ApplicationInfo,
	DeviceInfo,
	HardwareInfo,
	NotificationsInfo,
	OSInfo
} from "@teardown/schemas";

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
}
