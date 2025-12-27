import type {
  ApplicationInfo,
  HardwareInfo,
  OSInfo
} from "@teardown/schemas";
import * as Application from "expo-application";
import * as Device from "expo-device";
import { Platform } from "react-native";

import { DeviceInfoAdapter } from "./device.adpater-interface";

/**
 * Maps expo-device DeviceType to a string representation
 */
function mapDeviceType(deviceType: Device.DeviceType | null): string {
  switch (deviceType) {
    case Device.DeviceType.PHONE:
      return "phone";
    case Device.DeviceType.TABLET:
      return "tablet";
    case Device.DeviceType.DESKTOP:
      return "desktop";
    case Device.DeviceType.TV:
      return "tv";
    default:
      return "unknown";
  }
}

export class ExpoDeviceAdapter extends DeviceInfoAdapter {
  get applicationInfo(): ApplicationInfo {
    return {
      version: Application.nativeApplicationVersion ?? "0.0.0",
      build_number: Number.parseInt(
        Application.nativeBuildVersion ?? "0",
        10
      ),
    };
  }

  get hardwareInfo(): HardwareInfo {
    return {
      device_name: Device.deviceName ?? "Unknown Device",
      device_brand: Device.brand ?? "Unknown Brand",
      device_type: mapDeviceType(Device.deviceType),
    };
  }

  get osInfo(): OSInfo {
    return {
      platform: this.mapPlatform(Platform.OS),
      name: Device.osName ?? Platform.OS,
      version: Device.osVersion ?? "0.0.0",
    };
  }
}
