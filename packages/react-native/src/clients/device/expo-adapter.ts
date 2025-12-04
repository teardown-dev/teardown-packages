import type {
  ApplicationInfo,
  HardwareInfo,
  NotificationsInfo,
  OSInfo,
} from "@teardown/schemas";
import * as Application from "expo-application";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { DeviceInfoAdapter } from "./device.adpater-interface";
import { DevicePlatformEnum, NotificationPlatformEnum } from "./device.client";

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

/**
 * Maps React Native Platform.OS to DevicePlatformEnum
 */
function mapPlatform(platform: typeof Platform.OS): DevicePlatformEnum {
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

/**
 * Determines the notification platform based on the device platform
 */
function getNotificationPlatform(): NotificationPlatformEnum {
  return NotificationPlatformEnum.EXPO;
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
      platform: mapPlatform(Platform.OS),
      name: Device.osName ?? Platform.OS,
      version: Device.osVersion ?? "0.0.0",
    };
  }

  get notificationsInfo(): NotificationsInfo {
    // Note: This returns a synchronous snapshot.
    // For accurate permission status, use getNotificationsInfoAsync()
    return {
      push: {
        enabled: false,
        granted: false,
        token: null,
        platform: getNotificationPlatform(),
      },
    };
  }

  /**
   * Async method to get accurate notification permissions and token.
   * Use this when you need real-time notification status.
   */
  async getNotificationsInfoAsync(): Promise<NotificationsInfo> {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    const granted = existingStatus === "granted";

    let token: string | null = null;
    if (granted) {
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync();
        token = tokenData.data;
      } catch {
        // Token retrieval failed, keep as null
      }
    }

    return {
      push: {
        enabled: granted,
        granted,
        token,
        platform: getNotificationPlatform(),
      },
    };
  }
}
