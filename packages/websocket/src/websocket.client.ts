import {
	type BaseEventEmitterEvent,
	EventEmitter,
	type Events,
} from "@teardown/event-emitter";
import { Logger } from "@teardown/logger";
import { Util } from "@teardown/util";
import { Mutex } from "async-mutex";
import type {
	BaseWebsocketEvent,
	ClientWebsocketEvents,
	ConnectionEstablishedWebsocketEvent,
	TeardownWebsocketEvents,
	WebsocketEvents,
} from "./events";

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

export type WebsocketLocalEvents = Events<{
	CONNECTION_STATUS_CHANGED: WebsocketConnectionStatusChangedEvent;
}>;

export type WebsocketClientOptions = {
	logger?: Logger;
	wss?: boolean;
	host?: string;
	port?: number;
	reconnectInterval?: number;
	maxReconnectAttempts?: number;
};

interface WebSocketMessageEvent extends Event {
	data?: any | undefined;
}

interface WebSocketErrorEvent extends Event {
	message?: string;
}

interface WebSocketCloseEvent extends Event {
	code?: number | undefined;
	reason?: string | undefined;
	message?: string | undefined;
}

export abstract class WebsocketClient<Events extends WebsocketEvents<any>> {
	readonly instanceId = Util.generateUUID();
	public logger: Logger;

	private ws: WebSocket | null = null;
	private _status: WebsocketConnectionStatus = "CONNECTING";
	emitter: EventEmitter<WebsocketLocalEvents> =
		new EventEmitter<WebsocketLocalEvents>();

	host = "localhost";
	port = 20024;
	private reconnectInterval: number;
	private maxReconnectAttempts: number;
	private reconnectAttempts = 0;
	private eventQueue: Array<
		BaseWebsocketEvent<keyof Events, Events[keyof Events]["payload"]>
	> = [];

	_client_id: string | null = null;

	private processingQueueMutex = new Mutex();
	private isProcessingQueue = false;

	constructor(options?: WebsocketClientOptions) {
		const {
			wss = false,
			port = 20024,
			reconnectInterval = 5000,
			maxReconnectAttempts = 5,
		} = options ?? {};

		this.logger = options?.logger ?? new Logger("Websocket");

		this.host = options?.host ?? this.getHost();
		this.port = port;
		this.reconnectInterval = reconnectInterval;
		this.maxReconnectAttempts = maxReconnectAttempts;

		console.log("WebsocketClient constructor", {
			host: this.host,
			port: this.port,
			wss,
		});

		this.connect(wss);
	}

	private connect(wss: boolean) {
		const protocol = wss ? "wss" : "ws";
		const url = `${protocol}://${this.host}:${this.port}`;

		this.logger.log("Connecting to websocket", {
			host: this.host,
			port: this.port,
			url,
		});

		this.ws = new WebSocket(url);
		this.ws.onopen = this.onWebsocketConnect.bind(this);
		this.ws.onclose = this.onWebsocketDisconnect.bind(this);
		this.ws.onerror = this.onWebsocketConnectFailed.bind(this);
		this.ws.onmessage = this.onMessage.bind(this);
	}

	public getHost() {
		return "localhost";
	}

	private setStatus(status: WebsocketConnectionStatus) {
		this.logger.log("Debugger status change", status);
		this._status = status;
		this.emitter.emit("CONNECTION_STATUS_CHANGED", {
			status,
		});
	}

	public getStatus() {
		return this._status;
	}

	private onWebsocketConnect() {
		this.logger.log("Debugger connection opened");
		this.setStatus("CONNECTED");
		this.reconnectAttempts = 0;
	}

	private onWebsocketDisconnect(event: WebSocketCloseEvent) {
		this.logger.log("Debugger disconnected", event);
		this.setStatus("DISCONNECTED");
		this._client_id = null;
		this.attemptReconnect();
	}

	private onWebsocketConnectFailed(error: WebSocketErrorEvent) {
		this.logger.error("Debugger connection failed", error);
		this.setStatus("FAILED");
		this._client_id = null;
		this.attemptReconnect();
	}

	private attemptReconnect() {
		if (this.reconnectAttempts < this.maxReconnectAttempts) {
			this.reconnectAttempts++;
			this.setStatus("RECONNECTING");
			this.logger.log(
				`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
			);
			setTimeout(() => this.connect(this.port === 443), this.reconnectInterval);
		} else {
			this.setStatus("FAILED");
			this.logger.error("Max reconnection attempts reached");
		}
	}

	private async parseWebsocketData(
		event: WebSocketMessageEvent,
	): Promise<Events[keyof Events]["payload"] | null> {
		try {
			let rawData: any;

			if (typeof event.data === "string") {
				rawData = JSON.parse(event.data);
			} else if (event.data instanceof ArrayBuffer) {
				rawData = JSON.parse(new TextDecoder().decode(event.data));
			} else if (event.data instanceof Blob) {
				const text = await new Promise<string>((resolve, reject) => {
					if (!(event.data instanceof Blob)) {
						return reject(new Error("Invalid Blob data"));
					}

					const reader = new FileReader();
					reader.onload = () => resolve(reader.result as string);
					reader.onerror = () => reject(new Error("Failed to read Blob data"));
					reader.readAsText(event.data);
				});
				rawData = JSON.parse(text);
			} else {
				rawData = JSON.parse(JSON.stringify(event.data));
			}

			if (
				rawData == null ||
				typeof rawData !== "object" ||
				!("type" in rawData)
			) {
				console.error("Invalid websocket message format", { event, rawData });
				return null;
			}

			console.log("parsed websocket data", rawData);

			return rawData as Events[keyof Events]["payload"];
		} catch (error) {
			console.error("Failed to parse websocket message", {
				event,
				error,
			});
			return null;
		}
	}

	private async onMessage(event: WebSocketMessageEvent) {
		// this.logger.log("onMessage", event);

		const websocketEvent = await this.parseWebsocketData(event);
		// this.logger.log("parsed websocket event", websocketEvent);

		if (websocketEvent == null) {
			this.logger.error("Failed to parse websocket message", { event });
			return;
		}

		// console.log("websocket event", websocketEvent);
		this.onEvent?.(websocketEvent);

		switch (websocketEvent.type) {
			case "CONNECTION_ESTABLISHED":
				this.handleConnectionEstablished(websocketEvent);
				break;
			default:
		}
	}

	protected onEvent(event: Events[keyof Events]) {
		this.logger.log("onEvent", event);
	}

	public async handleConnectionEstablished(
		event: ConnectionEstablishedWebsocketEvent,
	) {
		this._client_id = event.client_id;

		// Set flag and acquire mutex before processing queue
		this.isProcessingQueue = true;
		await this.processingQueueMutex.acquire();
		try {
			await this.processEventQueue();
		} finally {
			this.isProcessingQueue = false;
			this.processingQueueMutex.release();
		}
		this.logger.log("Connection established");

		this.onConnectionEstablished?.(event);
	}

	public abstract onConnectionEstablished?(
		event: ConnectionEstablishedWebsocketEvent,
	): void;

	public async send<
		Type extends keyof Events,
		Payload extends Events[Type]["payload"],
	>(type: Type, payload: Payload) {
		const event: BaseWebsocketEvent<Type, Payload> = {
			instance_id: this.instanceId,
			event_id: Util.generateUUID(),
			client_id: this._client_id ?? "",
			timestamp: performance.now(),
			type,
			payload,
		};

		if (this._client_id === null || this.getStatus() !== "CONNECTED") {
			this.eventQueue.push(event);
			return;
		}

		// Wait for queue processing to complete before sending new events
		if (this.isProcessingQueue) {
			await this.processingQueueMutex.waitForUnlock();
		}

		this.sendEvent(event);
	}

	private sendEvent<
		Type extends keyof Events,
		Payload extends Events[Type]["payload"],
	>(event: BaseWebsocketEvent<Type, Payload>) {
		if (this.ws == null) {
			return;
		}

		this.ws.send(JSON.stringify(event));
	}

	private async processEventQueue() {
		// this.logger.log(
		// 	`Processing event queue (${this.eventQueue.length} events)`,
		// );
		while (this.eventQueue.length > 0) {
			const queuedEvent = this.eventQueue.shift();
			if (queuedEvent) {
				if (this._client_id == null) {
					this.logger.error("Client ID is null while processing event queue");
					throw new Error("Websocket client ID is null");
				}

				const event: BaseWebsocketEvent<
					typeof queuedEvent.type,
					typeof queuedEvent.payload
				> = {
					...queuedEvent,
					client_id: this._client_id,
				};
				this.sendEvent(event);
			}
		}
	}

	public shutdown() {
		this.ws?.close();
	}
}
