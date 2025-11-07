import {
	type BaseEventEmitterEvent,
	EventEmitter,
	type Events,
} from "@teardown/event-emitter";
import { Logger } from "@teardown/logger";
import { Util } from "@teardown/util";
import { Mutex } from "async-mutex";

export type WebsocketConnectionStatus =
	| "CONNECTING"
	| "CONNECTED"
	| "RETRYING"
	| "RECONNECTING"
	| "DISCONNECTED"
	| "FAILED";

export type WebsocketConnectionStatusChangedEvent = BaseEventEmitterEvent<
	"CONNECTION_STATUS_CHANGED",
	{
		status: WebsocketConnectionStatus;
	}
>;

export type WebsocketEvents = Events<{
	CONNECTION_STATUS_CHANGED: WebsocketConnectionStatusChangedEvent;
}>;

export type WebsocketClientOptions = {
	logger?: Logger;
	loggerName?: string;
	wss?: boolean;
	host?: string;
	port?: number;
	path?: string;
	reconnectInterval?: number;
	maxReconnectAttempts?: number;
	autoConnect?: boolean;
};

export interface WebSocketMessageEvent extends Event {
	data?: any | undefined;
}

export interface WebSocketErrorEvent extends Event {
	message?: string;
}

export interface WebSocketCloseEvent extends Event {
	code?: number | undefined;
	reason?: string | undefined;
	message?: string | undefined;
}

export class WebsocketClient {
	readonly instanceId = Util.generateUUID();
	public logger: Logger;

	private ws: WebSocket | null = null;
	private _status: WebsocketConnectionStatus = "CONNECTING";
	emitter: EventEmitter<WebsocketEvents> = new EventEmitter<WebsocketEvents>();

	private wss: boolean;
	private host: string;
	private port: number;
	private path: string;
	private reconnectInterval: number;
	private maxReconnectAttempts: number;
	private reconnectAttempts = 0;
	private eventQueue: Array<string> = [];

	private processingQueueMutex = new Mutex();
	private isProcessingQueue = false;

	constructor(options?: WebsocketClientOptions) {
		const {
			wss = false,
			port = 20024,
			reconnectInterval = 2000,
			maxReconnectAttempts = 10,
			autoConnect = true,
		} = options ?? {};

		this.logger =
			options?.logger ?? new Logger(options?.loggerName ?? "Websocket");

		this.wss = wss;
		this.host = options?.host ?? this.getHost();
		this.port = port;
		this.path = options?.path ?? "/";
		this.reconnectInterval = reconnectInterval;
		this.maxReconnectAttempts = maxReconnectAttempts;

		console.log("WebsocketClient constructor", {
			host: this.host,
			port: this.port,
			wss,
		});

		if (autoConnect) {
			this.connect();
		}
	}

	public getHost() {
		return "localhost";
	}

	public getProtocol() {
		return this.wss ? "wss" : "ws";
	}

	public getUrl() {
		return `${this.getProtocol()}://${this.host}:${this.port}${this.path}`;
	}

	private async connect() {
		const url = this.getUrl();

		this.logger.log("Connecting to websocket", {
			host: this.host,
			port: this.port,
			path: this.path,
			url,
		});

		this.ws = new WebSocket(url);
		this.ws.onopen = this.onWebsocketConnect.bind(this);
		this.ws.onclose = this.onWebsocketDisconnect.bind(this);
		this.ws.onerror = this.onWebsocketConnectFailed.bind(this);
		this.ws.onmessage = this.onMessage.bind(this);
	}

	private setStatus(status: WebsocketConnectionStatus) {
		this.logger.log("Websocket status change", status);
		this._status = status;
		this.emitter.emit("CONNECTION_STATUS_CHANGED", {
			status,
		});
	}

	public getStatus() {
		return this._status;
	}

	private onWebsocketConnect() {
		this.logger.log("Websocket connection opened");
		this.setStatus("CONNECTED");
		this.reconnectAttempts = 0;
		this.processEventQueue();
	}

	private onWebsocketDisconnect(event: WebSocketCloseEvent) {
		this.logger.log("Websocket disconnected", event);
		this.setStatus("DISCONNECTED");
		this.attemptReconnect();
	}

	private onWebsocketConnectFailed(error: WebSocketErrorEvent) {
		this.logger.error("Websocket connection failed", error);
		this.setStatus("FAILED");
		this.attemptReconnect();
	}

	private attemptReconnect() {
		if (this.reconnectAttempts < this.maxReconnectAttempts) {
			this.reconnectAttempts++;
			this.setStatus("RECONNECTING");
			this.logger.log(
				`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
			);
			setTimeout(() => this.connect(), this.reconnectInterval);
		} else {
			this.setStatus("FAILED");
			this.logger.error("Max reconnection attempts reached");
		}
	}

	public onMessage(event: WebSocketMessageEvent) {}

	public async send(data: string) {
		if (this.ws == null || this.getStatus() !== "CONNECTED") {
			this.eventQueue.push(data);
			return;
		}

		// Wait for queue processing to complete before sending new events
		if (this.isProcessingQueue) {
			await this.processingQueueMutex.waitForUnlock();
		}

		this.ws.send(data);
	}

	private async processEventQueue() {
		// this.logger.log(
		// 	`Processing event queue (${this.eventQueue.length} events)`,
		// );

		while (this.eventQueue.length > 0) {
			const queuedEvent = this.eventQueue.shift();
			if (queuedEvent) {
				this.send(queuedEvent);
			}
		}
	}

	public shutdown() {
		console.log("Shutting down websocket client");
		this.ws?.close();
	}
}
