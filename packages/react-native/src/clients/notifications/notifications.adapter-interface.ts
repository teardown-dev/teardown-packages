import { NotificationPlatformEnum } from "../device/device.client";

/**
 * Permission status returned from notification permission requests.
 */
export interface PermissionStatus {
	/** Whether notifications permission is granted */
	granted: boolean;
	/** Whether the user can be prompted again (iOS specific) */
	canAskAgain: boolean;
}

/**
 * Normalized push notification payload across all adapters.
 */
export interface PushNotification {
	/** Notification title */
	title?: string;
	/** Notification body text */
	body?: string;
	/** Custom data payload */
	data?: Record<string, unknown>;
}

/**
 * Function to unsubscribe from event listeners.
 */
export type Unsubscribe = () => void;

/**
 * Abstract adapter interface for push notification providers.
 *
 * Implement this interface to add support for different push notification
 * libraries (expo-notifications, firebase messaging, react-native-notifications).
 *
 * @example
 * ```typescript
 * class MyNotificationAdapter extends NotificationAdapter {
 *   get platform() { return NotificationPlatformEnum.FCM; }
 *   async getToken() { ... }
 *   // ... implement other methods
 * }
 * ```
 */
export abstract class NotificationAdapter {
	/**
	 * The notification platform this adapter supports.
	 * Used to identify token type when sending to backend.
	 */
	abstract get platform(): NotificationPlatformEnum;

	/**
	 * Get the current push notification token.
	 * Returns null if permissions not granted or token unavailable.
	 */
	abstract getToken(): Promise<string | null>;

	/**
	 * Request push notification permissions from the user.
	 * On iOS, shows the permission dialog. On Android 13+, requests POST_NOTIFICATIONS.
	 */
	abstract requestPermissions(): Promise<PermissionStatus>;

	/**
	 * Subscribe to token refresh events.
	 * Called when the push token changes (e.g., after app reinstall or token rotation).
	 *
	 * @param listener - Callback invoked with new token
	 * @returns Unsubscribe function to remove the listener
	 */
	abstract onTokenRefresh(listener: (token: string) => void): Unsubscribe;

	/**
	 * Subscribe to foreground notification events.
	 * Called when a notification is received while the app is in the foreground.
	 *
	 * @param listener - Callback invoked with notification payload
	 * @returns Unsubscribe function to remove the listener
	 */
	abstract onNotificationReceived(
		listener: (notification: PushNotification) => void
	): Unsubscribe;

	/**
	 * Subscribe to notification opened events.
	 * Called when the user taps on a notification to open the app.
	 *
	 * @param listener - Callback invoked with notification payload
	 * @returns Unsubscribe function to remove the listener
	 */
	abstract onNotificationOpened(
		listener: (notification: PushNotification) => void
	): Unsubscribe;
}
