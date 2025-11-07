
import {
    BaseEventEmitterEvent,
    EventEmitter,
    Events,
} from '@teardown/event-emitter';
import {Logger} from '@teardown/logger';
import {Util} from '@teardown/util';
import {
    BaseWebsocketEvent,
    ClientWebsocketEvents,
    ConnectionEstablishedWebsocketEvent,
    WebsocketEvents,
} from './events';

export type WebsocketConnectionStatus =
    | 'CONNECTING'
    | 'CONNECTED'
    | 'RETRYING'
    | 'RECONNECTING'
    | 'DISCONNECTED'
    | 'FAILED';

export type WebsocketConnectionStatusChangedEvent = BaseEventEmitterEvent<
    'CONNECTION_STATUS_CHANGED',
    {
        status: WebsocketConnectionStatus;
    }
>;

export type WebsocketLocalEvents = Events<{
    CONNECTION_STATUS_CHANGED: WebsocketConnectionStatusChangedEvent;
}>;

export type WebsocketClientOptions = {
    wss?: boolean;
    host?: string;
    port?: number;
};

interface WebSocketMessageEvent extends Event {
    data?: any | undefined;
}

interface WebSocketErrorEvent extends Event {
    message: string;
}

interface WebSocketCloseEvent extends Event {
    code?: number | undefined;
    reason?: string | undefined;
    message?: string | undefined;
}

export class WebsocketClient<Events extends WebsocketEvents<any>> {
    readonly instanceId = Util.generateUUID();
    public logger = new Logger('Websocket');

    private ws: WebSocket;
    private _status: WebsocketConnectionStatus = 'CONNECTING';
    emitter = new EventEmitter<WebsocketLocalEvents>();

    host = 'localhost';
    port = 20024;

    client_id: string | null = null;

    // @ts-ignore
    constructor(options?: WebsocketClientOptions) {
        const {wss = false, port = 20024} = options ?? {};

        const host = options?.host ?? this.getHost();

        const protocol = wss ? 'wss' : 'ws';
        const url = `${protocol}://${host}:${port}`;

        this.logger.log('Connecting to websocket', {
            host,
            port,
            url,
        });

        this.ws = new WebSocket(url);
        this.ws.onopen = this.onWebsocketConnect.bind(this);
        this.ws.onclose = this.onWebsocketDisconnect.bind(this);

        // @ts-ignore
        this.ws.onerror = this.onWebsocketConnectFailed.bind(this);
        this.ws.onmessage = this.onMessage.bind(this);
    }

    public getHost() {
        return 'localhost';
    }

    private setStatus(status: WebsocketConnectionStatus) {
        this.logger.log('Debugger status change', status);
        this._status = status;
        this.emitter.emit('CONNECTION_STATUS_CHANGED', {
            status,
        });
    }

    public getStatus() {
        return this._status;
    }

    private onWebsocketConnect() {
        this.logger.log('Debugger connection opened');
        this.setStatus('CONNECTED');
    }

    private onWebsocketDisconnect(event: WebSocketCloseEvent) {
        this.logger.log('Debugger disconnected', event);
        this.setStatus('DISCONNECTED');
    }

    private onWebsocketConnectFailed(error: WebSocketErrorEvent) {
        this.logger.error('Debugger connection failed', error);
        this.setStatus('FAILED');
    }

    private async parseMessage(
        event: WebSocketMessageEvent,
    ): Promise<Events[keyof Events]["payload"] | null> {
        try {
            let rawData: any;

            if (typeof event.data === 'string') {
                rawData = JSON.parse(event.data);
            } else if (event.data instanceof ArrayBuffer) {
                rawData = JSON.parse(new TextDecoder().decode(event.data));
            } else if (event.data instanceof Blob) {
                const text = await new Promise<string>((resolve, reject) => {
                    if (!(event.data instanceof Blob)) {
                        return reject(new Error('Invalid Blob data'));
                    }

                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = () => reject(new Error('Failed to read Blob data'));
                    reader.readAsText(event.data);
                });
                rawData = JSON.parse(text);
            } else {
                rawData = JSON.parse(JSON.stringify(event.data));
            }

            if (
                rawData == null ||
                typeof rawData !== 'object' ||
                !('type' in rawData)
            ) {
                console.error('Invalid websocket message format', {event, rawData});
                return null;
            }

            return rawData as Events[keyof Events]["payload"];
        } catch (error) {
            console.error('Failed to parse websocket message', {
                event,
                error,
            });
            return null;
        }
    }

    private async onMessage(event: WebSocketMessageEvent) {
        const websocketEvent = await this.parseMessage(event);
        if (websocketEvent == null) {
            return;
        }

        switch (websocketEvent.type) {
            case 'CONNECTION_ESTABLISHED':
                this.onConnectionEstablished(websocketEvent);
                break;
            default:
                this.onEvent(websocketEvent);
        }
    }

    public onEvent(event: ClientWebsocketEvents[keyof ClientWebsocketEvents]) {
        this.logger.log('onEvent', event);
    }

    public onConnectionEstablished(event: ConnectionEstablishedWebsocketEvent) {
        this.logger.log('Connection established', event);
    }

    public send<
        Type extends keyof Events,
        Payload extends Events[Type]['payload'],
    >(type: Type, payload: Payload) {
        if (this.client_id == null) {
            return;
        }

        const event: BaseWebsocketEvent<Type, Payload> = {
            instance_id: this.instanceId,
            event_id: Util.generateUUID(),
            client_id: this.client_id,
            timestamp: Date.now(),
            type,
            payload,
        };

        this.ws.send(JSON.stringify(event));
    }
}
