import EventEmitter from "eventemitter3";
import type { Logger, LoggingClient } from "../logging";
import type { StorageClient, SupportedStorage } from "../storage";
import type { NotificationPlatformEnum } from "../device/device.client";
import type {
	NotificationAdapter,
	PermissionStatus,
	PushNotification,
	Unsubscribe,
} from "./notifications.adapter-interface";

interface NotificationEvents {
	TOKEN_CHANGED: (token: string) => void;
	NOTIFICATION_RECEIVED: (notification: PushNotification) => void;
	NOTIFICATION_OPENED: (notification: PushNotification) => void;
}

export interface NotificationsClientOptions {
	/** The notification adapter to use (expo, firebase, wix) */
	adapter: NotificationAdapter;
}

/**
 * Client for managing push notifications across different providers.
 *
 * Uses an adapter pattern to support multiple notification libraries:
 * - expo-notifications (Expo projects)
 * - @react-native-firebase/messaging (Firebase FCM)
 * - react-native-notifications (Wix)
 *
 * @example
 * ```typescript
 * import { NotificationsClient } from "@teardown/react-native";
 * import { ExpoNotificationsAdapter } from "@teardown/react-native/expo-notifications";
 *
 * const notifications = new NotificationsClient(logging, storage, {
 *   adapter: new ExpoNotificationsAdapter()
 * });
 *
 * await notifications.requestPermissions();
 * const token = await notifications.getToken();
 * ```
 */
export class NotificationsClient {
	private logger: Logger;
	private storage: SupportedStorage;
	private emitter = new EventEmitter<NotificationEvents>();
	private token: string | null = null;
	private initialized = false;
	private adapterUnsubscribers: Unsubscribe[] = [];

	constructor(
		logging: LoggingClient,
		storage: StorageClient,
		private readonly options: NotificationsClientOptions
	) {
		this.logger = logging.createLogger({
			name: "NotificationsClient",
		});
		this.storage = storage.createStorage("notifications");
	}

	/**
	 * Initialize the notifications client.
	 * Sets up event listeners for token refresh and incoming notifications.
	 * Call this after constructing the client.
	 */
	async initialize(): Promise<void> {
		if (this.initialized) {
			this.logger.warn("NotificationsClient already initialized");
			return;
		}

		this.logger.debug("Initializing NotificationsClient");

		// Load cached token
		const cachedToken = this.storage.getItem("token");
		if (cachedToken) {
			this.token = cachedToken;
			this.logger.debug("Loaded cached token");
		}

		// Subscribe to adapter events
		const tokenRefreshUnsub = this.options.adapter.onTokenRefresh(
			(newToken) => {
				this.handleTokenChange(newToken);
			}
		);
		this.adapterUnsubscribers.push(tokenRefreshUnsub);

		const notificationReceivedUnsub =
			this.options.adapter.onNotificationReceived((notification) => {
				this.logger.debug("Notification received in foreground", notification);
				this.emitter.emit("NOTIFICATION_RECEIVED", notification);
			});
		this.adapterUnsubscribers.push(notificationReceivedUnsub);

		const notificationOpenedUnsub = this.options.adapter.onNotificationOpened(
			(notification) => {
				this.logger.debug("Notification opened by user", notification);
				this.emitter.emit("NOTIFICATION_OPENED", notification);
			}
		);
		this.adapterUnsubscribers.push(notificationOpenedUnsub);

		this.initialized = true;
		this.logger.debug("NotificationsClient initialized");
	}

	/**
	 * Request push notification permissions from the user.
	 */
	async requestPermissions(): Promise<PermissionStatus> {
		this.logger.debug("Requesting notification permissions");
		const status = await this.options.adapter.requestPermissions();
		this.logger.debug("Permission status", status);
		return status;
	}

	/**
	 * Get the current push notification token.
	 * Returns cached token if available, otherwise fetches from adapter.
	 */
	async getToken(): Promise<string | null> {
		// Return cached token if we have one
		if (this.token) {
			return this.token;
		}

		this.logger.debug("Fetching token from adapter");
		const token = await this.options.adapter.getToken();

		if (token) {
			this.handleTokenChange(token);
		}

		return token;
	}

	/**
	 * Get the notification platform type (EXPO, FCM, APNS).
	 */
	get platform(): NotificationPlatformEnum {
		return this.options.adapter.platform;
	}

	/**
	 * Subscribe to token change events.
	 *
	 * @param listener - Callback invoked when token changes
	 * @returns Unsubscribe function
	 */
	onTokenChange(listener: (token: string) => void): Unsubscribe {
		this.emitter.addListener("TOKEN_CHANGED", listener);
		return () => this.emitter.removeListener("TOKEN_CHANGED", listener);
	}

	/**
	 * Subscribe to foreground notification events.
	 *
	 * @param listener - Callback invoked when notification received in foreground
	 * @returns Unsubscribe function
	 */
	onNotificationReceived(
		listener: (notification: PushNotification) => void
	): Unsubscribe {
		this.emitter.addListener("NOTIFICATION_RECEIVED", listener);
		return () =>
			this.emitter.removeListener("NOTIFICATION_RECEIVED", listener);
	}

	/**
	 * Subscribe to notification opened events.
	 *
	 * @param listener - Callback invoked when user taps a notification
	 * @returns Unsubscribe function
	 */
	onNotificationOpened(
		listener: (notification: PushNotification) => void
	): Unsubscribe {
		this.emitter.addListener("NOTIFICATION_OPENED", listener);
		return () => this.emitter.removeListener("NOTIFICATION_OPENED", listener);
	}

	/**
	 * Clean up event listeners and resources.
	 */
	destroy(): void {
		this.logger.debug("Destroying NotificationsClient");

		// Unsubscribe from adapter events
		for (const unsub of this.adapterUnsubscribers) {
			unsub();
		}
		this.adapterUnsubscribers = [];

		// Remove all listeners
		this.emitter.removeAllListeners();

		this.initialized = false;
	}

	private handleTokenChange(newToken: string): void {
		if (this.token !== newToken) {
			this.logger.debug("Token changed");
			this.token = newToken;
			this.storage.setItem("token", newToken);
			this.emitter.emit("TOKEN_CHANGED", newToken);
		}
	}
}
