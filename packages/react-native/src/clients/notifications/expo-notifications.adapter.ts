import * as Notifications from "expo-notifications";
import { NotificationPlatformEnum } from "../device/device.client";
import {
	NotificationAdapter,
	type DataMessage,
	type PermissionStatus,
	type PushNotification,
	type Unsubscribe,
} from "./notifications.adapter-interface";

/**
 * Notification adapter for expo-notifications library.
 * Uses Expo push tokens for routing through Expo's notification service.
 *
 * @example
 * ```typescript
 * import { NotificationsClient } from "@teardown/react-native";
 * import { ExpoNotificationsAdapter } from "@teardown/react-native/expo-notifications";
 *
 * const notifications = new NotificationsClient(logging, storage, {
 *   adapter: new ExpoNotificationsAdapter()
 * });
 * ```
 */
export class ExpoNotificationsAdapter extends NotificationAdapter {
	get platform(): NotificationPlatformEnum {
		return NotificationPlatformEnum.EXPO;
	}

	async getToken(): Promise<string | null> {
		try {
			const { status } = await Notifications.getPermissionsAsync();
			if (status !== "granted") {
				return null;
			}

			const tokenData = await Notifications.getExpoPushTokenAsync();
			return tokenData.data;
		} catch {
			return null;
		}
	}

	async requestPermissions(): Promise<PermissionStatus> {
		const { status, canAskAgain } =
			await Notifications.requestPermissionsAsync();

		return {
			granted: status === "granted",
			canAskAgain: canAskAgain ?? true,
		};
	}

	onTokenRefresh(listener: (token: string) => void): Unsubscribe {
		const subscription = Notifications.addPushTokenListener((event) => {
			// Expo push token listener returns ExpoPushToken object
			if (event.data) {
				listener(event.data);
			}
		});

		return () => subscription.remove();
	}

	onNotificationReceived(
		listener: (notification: PushNotification) => void
	): Unsubscribe {
		const subscription = Notifications.addNotificationReceivedListener(
			(notification) => {
				const content = notification.request.content;
				listener({
					title: content.title ?? undefined,
					body: content.body ?? undefined,
					data: content.data ?? undefined,
				});
			}
		);

		return () => subscription.remove();
	}

	onNotificationOpened(
		listener: (notification: PushNotification) => void
	): Unsubscribe {
		const subscription = Notifications.addNotificationResponseReceivedListener(
			(response) => {
				const content = response.notification.request.content;
				listener({
					title: content.title ?? undefined,
					body: content.body ?? undefined,
					data: content.data ?? undefined,
				});
			}
		);

		return () => subscription.remove();
	}

	onDataMessage(listener: (message: DataMessage) => void): Unsubscribe {
		// In Expo, data-only messages come through the same listener as regular notifications
		// but without title/body. We filter for messages that have data but no display content.
		const subscription = Notifications.addNotificationReceivedListener(
			(notification) => {
				const content = notification.request.content;
				// Data-only message: has data but no title or body
				if (content.data && !content.title && !content.body) {
					listener({
						data: content.data,
					});
				}
			}
		);

		return () => subscription.remove();
	}
}
