import { Platform } from "react-native";
import { type Notification, Notifications, type Registered } from "react-native-notifications";
import { NotificationPlatformEnum } from "../device/device.client";
import {
	type DataMessage,
	NotificationAdapter,
	type PermissionStatus,
	type PushNotification,
	type Unsubscribe,
} from "./notifications.adapter-interface";

/**
 * Notification adapter for react-native-notifications (Wix) library.
 * Uses native FCM/APNS tokens for push notifications.
 *
 * Note: This library uses event-based token delivery, which is normalized
 * to a Promise-based API by this adapter.
 *
 * @example
 * ```typescript
 * import { NotificationsClient } from "@teardown/react-native";
 * import { WixNotificationsAdapter } from "@teardown/react-native/wix-notifications";
 *
 * const notifications = new NotificationsClient(logging, storage, {
 *   adapter: new WixNotificationsAdapter()
 * });
 * ```
 */
export class WixNotificationsAdapter extends NotificationAdapter {
	private tokenPromise: Promise<string> | null = null;
	private tokenResolver: ((token: string) => void) | null = null;
	private currentToken: string | null = null;
	private tokenListeners: Set<(token: string) => void> = new Set();

	constructor() {
		super();
		this.setupTokenListener();
	}

	get platform(): NotificationPlatformEnum {
		return Platform.OS === "ios" ? NotificationPlatformEnum.APNS : NotificationPlatformEnum.FCM;
	}

	async getToken(): Promise<string | null> {
		if (this.currentToken) {
			return this.currentToken;
		}

		// Create a promise that will resolve when we receive the token
		if (!this.tokenPromise) {
			this.tokenPromise = new Promise<string>((resolve) => {
				this.tokenResolver = resolve;
			});

			// Trigger registration to get token
			Notifications.registerRemoteNotifications();
		}

		try {
			// Wait for token with timeout
			const token = await Promise.race([
				this.tokenPromise,
				new Promise<null>((_, reject) => setTimeout(() => reject(new Error("Token timeout")), 10000)),
			]);
			return token;
		} catch {
			return null;
		}
	}

	async requestPermissions(): Promise<PermissionStatus> {
		return new Promise((resolve) => {
			// Set up one-time listener for registration result
			const registeredHandler = () => {
				resolve({ granted: true, canAskAgain: true });
			};

			const deniedHandler = () => {
				resolve({ granted: false, canAskAgain: false });
			};

			// Subscribe to registration events
			Notifications.events().registerRemoteNotificationsRegistered(registeredHandler);
			Notifications.events().registerRemoteNotificationsRegistrationDenied(deniedHandler);

			// Trigger registration
			Notifications.registerRemoteNotifications();

			// Timeout fallback
			setTimeout(() => {
				resolve({ granted: false, canAskAgain: true });
			}, 10000);
		});
	}

	onTokenRefresh(listener: (token: string) => void): Unsubscribe {
		this.tokenListeners.add(listener);

		// If we already have a token, call listener immediately
		if (this.currentToken) {
			listener(this.currentToken);
		}

		return () => {
			this.tokenListeners.delete(listener);
		};
	}

	onNotificationReceived(listener: (notification: PushNotification) => void): Unsubscribe {
		const subscription = Notifications.events().registerNotificationReceivedForeground(
			(
				notification: Notification,
				completion: (response: { alert: boolean; sound: boolean; badge: boolean }) => void
			) => {
				const payload = notification.payload;
				listener({
					title: payload.title,
					body: payload.body,
					data: payload,
				});
				completion({ alert: true, sound: true, badge: true });
			}
		);

		return () => subscription.remove();
	}

	onNotificationOpened(listener: (notification: PushNotification) => void): Unsubscribe {
		const subscription = Notifications.events().registerNotificationOpened(
			(notification: Notification, completion: () => void) => {
				const payload = notification.payload;
				listener({
					title: payload.title,
					body: payload.body,
					data: payload,
				});
				completion();
			}
		);

		return () => subscription.remove();
	}

	onDataMessage(listener: (message: DataMessage) => void): Unsubscribe {
		// Wix library handles data-only messages through the same foreground listener
		// but without title/body in the payload
		const subscription = Notifications.events().registerNotificationReceivedForeground(
			(
				notification: Notification,
				completion: (response: { alert: boolean; sound: boolean; badge: boolean }) => void
			) => {
				const payload = notification.payload;
				// Data-only message: has payload but no title or body
				if (payload && !payload.title && !payload.body) {
					listener({
						data: payload,
					});
				}
				completion({ alert: false, sound: false, badge: false });
			}
		);

		return () => subscription.remove();
	}

	private setupTokenListener(): void {
		Notifications.events().registerRemoteNotificationsRegistered((event: Registered) => {
			this.currentToken = event.deviceToken;

			// Resolve any pending getToken promise
			if (this.tokenResolver) {
				this.tokenResolver(event.deviceToken);
				this.tokenResolver = null;
				this.tokenPromise = null;
			}

			// Notify all listeners
			for (const listener of this.tokenListeners) {
				listener(event.deviceToken);
			}
		});
	}
}
