import type { Events } from "@teardown/event-emitter";
import { Logger } from "@teardown/logger";
import {
	type ClientWebsocketEvents,
	type ConnectionEstablishedWebsocketEvent,
	WebsocketClient,
	type WebsocketClientOptions,
	type WebsocketConnectionStatus,
} from "@teardown/websocket";
import { NativeModules, Platform } from "react-native";
import DeviceInfo from "react-native-device-info";

export type DebuggerStatus = WebsocketConnectionStatus;

export type DebuggerOptions = WebsocketClientOptions & {
	deviceName?: string; // Allow custom device name override
};

export class Debugger extends WebsocketClient<ClientWebsocketEvents> {
	private deviceId: string;
	private customDeviceName?: string;

	constructor(options: DebuggerOptions) {
		super({
			logger: new Logger("Debugger"),
			...options,
		});
		this.customDeviceName = options.deviceName;
		// Initialize with a temporary value, will be set properly in init()
		this.deviceId = "";
		this.init();
	}

	private async init() {
		// Get unique device ID
		this.deviceId = await DeviceInfo.getUniqueId();
	}

	async getDeviceName() {
		if (this.customDeviceName) {
			return this.customDeviceName;
		}

		// Get actual device name if possible
		try {
			const deviceName = await DeviceInfo.getDeviceName();
			return deviceName;
		} catch (error) {
			// Fallback to basic platform names
			return Platform.select({
				ios: "iPhone",
				android: "Android",
				default: "Unknown Device",
			});
		}
	}

	public async onConnectionEstablished(
		event: ConnectionEstablishedWebsocketEvent,
	) {
		const deviceName = await this.getDeviceName();

		this.send("CLIENT_CONNECTION_ESTABLISHED", {
			deviceId: this.deviceId,
			deviceName,
			platform: Platform.OS,
			platformVersion: Platform.Version,
			reactNativeVersion: Platform.constants.reactNativeVersion,
			isDisableAnimations: Platform.constants.isDisableAnimations ?? false,
			isTesting: Platform.constants.isTesting,
		});
	}

	getHostFromUrl(url: string) {
		const host = url.match(
			/^(?:https?:\/\/)?(\[[^\]]+\]|[^/:\s]+)(?::\d+)?(?:[/?#]|$)/,
		)?.[1];

		if (typeof host !== "string") {
			throw new Error("Invalid URL - host not found");
		}
		return host;
	}

	getHost() {
		try {
			// https://github.com/facebook/react-native/blob/2a7f969500cef73b621269299619ee1f0ee9521a/packages/react-native/src/private/specs/modules/NativeSourceCode.js#L16
			const scriptURL = NativeModules?.SourceCode?.getConstants().scriptURL;
			if (typeof scriptURL !== "string")
				throw new Error("Invalid non-string URL");

			return this.getHostFromUrl(scriptURL);
		} catch (error) {
			const superHost = super.getHost();

			const errorMessage =
				typeof error === "object" && error !== null && "message" in error
					? error.message
					: String(error);

			this.logger.warn(
				`Failed to get host: "${errorMessage}" - Falling back to ${superHost}`,
			);
			return superHost;
		}
	}
}
