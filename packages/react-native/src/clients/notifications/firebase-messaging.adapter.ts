import messaging, {
	type FirebaseMessagingTypes,
} from "@react-native-firebase/messaging";
import { NotificationPlatformEnum } from "../device/device.client";
import {
	NotificationAdapter,
	type PermissionStatus,
	type PushNotification,
	type Unsubscribe,
} from "./notifications.adapter-interface";

/**
 * Notification adapter for @react-native-firebase/messaging library.
 * Uses FCM (Firebase Cloud Messaging) tokens for push notifications.
 *
 * @example
 * ```typescript
 * import { NotificationsClient } from "@teardown/react-native";
 * import { FirebaseMessagingAdapter } from "@teardown/react-native/firebase-messaging";
 *
 * const notifications = new NotificationsClient(logging, storage, {
 *   adapter: new FirebaseMessagingAdapter()
 * });
 * ```
 */
export class FirebaseMessagingAdapter extends NotificationAdapter {
	get platform(): NotificationPlatformEnum {
		return NotificationPlatformEnum.FCM;
	}

	async getToken(): Promise<string | null> {
		try {
			const token = await messaging().getToken();
			return token;
		} catch {
			return null;
		}
	}

	async requestPermissions(): Promise<PermissionStatus> {
		const authStatus = await messaging().requestPermission();

		const granted =
			authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
			authStatus === messaging.AuthorizationStatus.PROVISIONAL;

		// Firebase doesn't expose canAskAgain, assume true if not denied
		const canAskAgain =
			authStatus !== messaging.AuthorizationStatus.DENIED;

		return { granted, canAskAgain };
	}

	onTokenRefresh(listener: (token: string) => void): Unsubscribe {
		return messaging().onTokenRefresh(listener);
	}

	onNotificationReceived(
		listener: (notification: PushNotification) => void
	): Unsubscribe {
		return messaging().onMessage(
			(remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
				listener({
					title: remoteMessage.notification?.title,
					body: remoteMessage.notification?.body,
					data: remoteMessage.data,
				});
			}
		);
	}

	onNotificationOpened(
		listener: (notification: PushNotification) => void
	): Unsubscribe {
		return messaging().onNotificationOpenedApp(
			(remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
				listener({
					title: remoteMessage.notification?.title,
					body: remoteMessage.notification?.body,
					data: remoteMessage.data,
				});
			}
		);
	}
}
