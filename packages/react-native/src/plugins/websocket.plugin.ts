// @ts-ignore
import WebSocketInterceptor from "react-native/Libraries/WebSocket/WebSocketInterceptor";

import { Logger } from "@teardown/logger";
import { Util } from "@teardown/util";
import type {
	WebSocketCloseInfo,
	WebSocketInfo,
	WebSocketMessageInfo,
} from "@teardown/websocket";
import type { IPlugin, TeardownClient } from "../teardown.client";

export class WebSocketPlugin implements IPlugin {
	private logger = new Logger("WebSocketPlugin");
	private client: TeardownClient<any> | null = null;
	private sockets: Map<string, WebSocketInfo> = new Map();

	constructor() {
		this.setupWebSocketInterceptor();
	}

	install(client: TeardownClient<any>): void {
		this.client = client;
	}

	private setupWebSocketInterceptor(): void {
		if (WebSocketInterceptor.isInterceptorEnabled()) {
			this.logger.warn(
				"WebSocketInterceptor is already enabled by another library, disable it or run this first when your app loads",
			);
			this.disableInterception();
		}

		WebSocketInterceptor.setConnectCallback(this.wsConnectCallback);
		WebSocketInterceptor.setSendCallback(this.wsSendCallback);
		WebSocketInterceptor.setOnMessageCallback(this.wsOnMessageCallback);
		WebSocketInterceptor.setOnCloseCallback(this.wsOnCloseCallback);

		WebSocketInterceptor.enableInterception();

		this.logger.log("WebSocketInterceptor enabled");
	}

	private wsConnectCallback = (
		url: string,
		protocols: string | string[] | undefined,
		options: Object,
		socketId: string,
	): void => {
		const requestId = Util.generateUUID();
		const socketInfo: WebSocketInfo = {
			id: requestId,
			url,
			protocols,
			timestamp: performance.now(),
		};
		this.sockets.set(socketId, socketInfo);
		this.sendOpenEvent(socketInfo);
	};

	private wsSendCallback = (
		data: string | ArrayBuffer | ArrayBufferView,
		socketId: string,
	): void => {
		const socket = this.sockets.get(socketId);
		if (socket) {
			const messageInfo: WebSocketMessageInfo = {
				id: socket.id,
				data: "", // TODO: Currently getting array buffer length errors here when sending data
				timestamp: performance.now(),
				direction: "sent",
			};
			console.log("messageInfo", messageInfo);
			// this.sendMessageEvent(messageInfo);
		}
	};

	private wsOnMessageCallback = (
		socketId: string,
		message: WebSocketMessageEvent,
	): void => {
		const socket = this.sockets.get(socketId);
		if (socket) {
			const messageInfo: WebSocketMessageInfo = {
				id: socket.id,
				data: "", // TODO: Currently getting array buffer length errors here when sending data
				timestamp: performance.now(),
				direction: "received",
			};
			this.sendMessageEvent(messageInfo);
		}
	};

	private wsOnCloseCallback = (socketId: string, event: any): void => {
		const socket = this.sockets.get(socketId);
		if (socket) {
			const closeInfo: WebSocketCloseInfo = {
				id: socket.id,
				code: event.code,
				reason: event.reason,
				timestamp: performance.now(),
			};
			this.sendCloseEvent(closeInfo);
			this.sockets.delete(socketId);
		}
	};

	private sendOpenEvent(info: WebSocketInfo): void {
		if (this.client && this.client.debugger) {
			this.client.debugger.send("NETWORK_WEBSOCKET_OPEN", info);
		}
	}

	private sendMessageEvent(info: WebSocketMessageInfo): void {
		if (this.client && this.client.debugger) {
			this.client.debugger.send("NETWORK_WEBSOCKET_MESSAGE", info);
		}
	}

	private sendCloseEvent(info: WebSocketCloseInfo): void {
		if (this.client && this.client.debugger) {
			this.client.debugger.send("NETWORK_WEBSOCKET_CLOSE", info);
		}
	}

	disableInterception(): void {
		WebSocketInterceptor.disableInterception();
		this.sockets.clear();
	}
}
