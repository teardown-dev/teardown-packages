import {
  BaseEventEmitterEvent,
  EventEmitter,
  Events,
} from '@teardown/event-emitter';
import {Logger} from '@teardown/logger';
import {NativeModules, Platform} from 'react-native';
import {
  BaseWebsocketEvent,
  ClientWebsocketEvents,
  ConnectionEstablishedWebsocketEvent,
} from './debugger-websocket.events.ts';

export type DebuggerStatus =
  | 'CONNECTING'
  | 'CONNECTED'
  | 'RETRYING'
  | 'RECONNECTING'
  | 'DISCONNECTED'
  | 'FAILED';

export type DebuggerStatusChangedEvent = BaseEventEmitterEvent<
  'DEBUGGER_STATUS_CHANGED',
  {
    status: DebuggerStatus;
  }
>;

export type DebuggerEvents = Events<{
  DEBUGGER_STATUS_CHANGED: DebuggerStatusChangedEvent;
}>;

export type DebuggerOptions = {
  wss?: true;
  defaultHost?: string;
  host?: string;
  port?: number;
};

const randomUUID = () => {
  // uuid - 00000000-0000-0000-0000-000000000000
  const randomHex = () => Math.floor(Math.random() * 16).toString(16);
  return '00000000-0000-0000-0000-000000000000'.replace(/0/g, randomHex);
};

export class Debugger {
  readonly instanceId = randomUUID();

  private logger = new Logger('Debugger');

  private ws: WebSocket;
  private _status: DebuggerStatus = 'CONNECTING';
  emitter = new EventEmitter<DebuggerEvents>();

  client_id: string | null = null;

  // @ts-ignore
  constructor(options: DebuggerOptions) {
    const {wss = false, port = 20024} = options;

    const host =
      options.host ?? this.getHost(options.defaultHost ?? 'localhost');

    const protocol = wss ? 'wss' : 'ws';
    const url = `${protocol}://${host}:${port}`;

    this.logger.log('Connecting to debugger', {
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

  getHostFromUrl(url: string) {
    // Group 1: http(s)://
    // Group 2: host
    // Group 3: port
    // Group 4: rest
    const host = url.match(
      /^(?:https?:\/\/)?(\[[^\]]+\]|[^/:\s]+)(?::\d+)?(?:[/?#]|$)/,
    )?.[1];

    if (typeof host !== 'string') {
      throw new Error('Invalid URL - host not found');
    }

    return host;
  }

  getHost(defaultHost: string) {
    try {
      // RN Reference: https://github.com/facebook/react-native/blob/main/packages/react-native/src/private/specs/modules/NativeSourceCode.js
      const scriptURL = NativeModules?.SourceCode?.getConstants().scriptURL;

      if (typeof scriptURL !== 'string') {
        throw new Error('Invalid non-string URL');
      }

      return this.getHostFromUrl(scriptURL);
    } catch (error) {
      this.logger.error('Failed to get host from URL', error);
      return defaultHost;
    }
  }

  private setStatus(status: DebuggerStatus) {
    this.logger.log('Debugger status change', status);
    this._status = status;
    this.emitter.emit('DEBUGGER_STATUS_CHANGED', {
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
  ): Promise<ClientWebsocketEvents[keyof ClientWebsocketEvents] | null> {
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

      return rawData as ClientWebsocketEvents[keyof ClientWebsocketEvents];
    } catch (error) {
      console.error('Failed to parse websocket message', {
        event,
        error,
      });
      return null;
    }
  }

  private async onMessage(event: WebSocketMessageEvent) {
    this.logger.log('onMessage', event);

    // incoming websocketEvent from the debugger

    const websocketEvent = await this.parseMessage(event);
    if (websocketEvent == null) {
      return;
    }

    switch (websocketEvent.type) {
      case 'CONNECTION_ESTABLISHED':
        this.onConnectionEstablished(websocketEvent);
        break;
      default:
      // this.emitter.emit('DEBUGGER_EVENT', websocketEvent);
    }
  }

  private onConnectionEstablished(event: ConnectionEstablishedWebsocketEvent) {
    this.logger.log('Connection established', event);
    this.client_id = event.client_id;

    this.send('CLIENT_CONNECTION_ESTABLISHED', {
      deviceName: '~~~--- device name here ---~~~',
      platform: Platform.OS,
      platformVersion: Platform.Version,
      reactNativeVersion: Platform.constants.reactNativeVersion,
      isDisableAnimations: Platform.constants.isDisableAnimations ?? false,
      isTesting: Platform.constants.isTesting,
    });
  }

  send<
    Type extends keyof ClientWebsocketEvents,
    Payload extends ClientWebsocketEvents[Type]['payload'],
  >(type: Type, payload: Payload) {
    if (this.client_id == null) {
      return;
    }

    const event: BaseWebsocketEvent<Type, Payload> = {
      instance_id: this.instanceId,
      event_id: randomUUID(),
      client_id: this.client_id,
      timestamp: Date.now(),
      type,
      payload,
    };

    this.ws.send(JSON.stringify(event));
  }

  emitEvents() {}
}
