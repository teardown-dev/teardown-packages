import {
	type ApplicationInfo,
	type HardwareInfo,
	type OSInfo,
	OSType,
	type UpdateInfo,
} from "@teardown/ingest-api/schemas";
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
	// -- Application Information --
	/**
	 * The information about the application running.
	 */
	abstract get applicationInfo(): ApplicationInfo;
	// -- Updates Information --
	/**
	 * The information about the update running.
	 */
	abstract get updateInfo(): UpdateInfo | null;
	// -- Hardware Information --
	/**
	 * The information about the hardware of the device.
	 */
	abstract get hardwareInfo(): HardwareInfo;
	// -- OS Information --
	/**
	 * The information about the operating system of the device.
	 */
	abstract get osInfo(): OSInfo;
}
