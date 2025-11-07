export type BaseWebsocketEvent<
    Type,
    Payload extends Record<string, any> | string = object,
> = {
    client_id: string;
    instance_id: string;
    event_id: string;
    timestamp: number;
    type: Type;
    payload: Payload;
};

export type WebsocketEvents<WebsocketEvents extends Record<string, any>> = {
  [Type in keyof WebsocketEvents]: BaseWebsocketEvent<
      Type,
      WebsocketEvents[Type]['payload']
  >;
};

export type ConnectionEstablishedWebsocketEvent = BaseWebsocketEvent<
    'CONNECTION_ESTABLISHED',
    {}
>;

export type ReactNativeVersion = {
  major: number;
  minor: number;
  patch: number;
  prerelease?: number | null | undefined;
};

export type ClientConnectionEstablishedWebsocketEvent = BaseWebsocketEvent<
    'CLIENT_CONNECTION_ESTABLISHED',
    {
      deviceName: string;
      platform: string;
      platformVersion: string | number;
      reactNativeVersion: ReactNativeVersion;
      isDisableAnimations: boolean;
      isTesting: boolean;
    }
>;

export type WebsocketEvent = BaseWebsocketEvent<'WEBSOCKET_EVENT', string>;

export type ConsoleLogWebsocketEvent = BaseWebsocketEvent<
    'CONSOLE_LOG',
    {
      type: 'info' | 'warn' | 'error' | 'log' | 'debug';
      args: any[];
    }
>;

export type Headers = Record<string, string>;

export type HTTPRequestInfo = {
    id: string;
    url: string;
    method: string;
    headers: Headers;
    body?: string;
    timestamp: number;
};

export type HTTPResponseInfo = {
    id: string;
    status: number;
    headers: Headers;
    body?: string;
    timestamp: number;
};

export type WebSocketInfo = {
    id: string;
    url: string;
    protocols?: string | string[];
    timestamp: number;
};

export type WebSocketMessageInfo = {
    id: string;
    data: string | ArrayBuffer | ArrayBufferView;
    timestamp: number;
    direction: 'sent' | 'received';
};

export type WebSocketCloseInfo = {
    id: string;
    code: number;
    reason: string;
    timestamp: number;
};

export type NetworkHTTPRequestWebsocketEvent = BaseWebsocketEvent<
    'NETWORK_HTTP_REQUEST',
    HTTPRequestInfo
>;

export type NetworkHTTPResponseWebsocketEvent = BaseWebsocketEvent<
    'NETWORK_HTTP_RESPONSE',
    HTTPResponseInfo
>;

export type NetworkWebSocketOpenEvent = BaseWebsocketEvent<
    'NETWORK_WEBSOCKET_OPEN',
    WebSocketInfo
>;

export type NetworkWebSocketMessageEvent = BaseWebsocketEvent<
    'NETWORK_WEBSOCKET_MESSAGE',
    WebSocketMessageInfo
>;

export type NetworkWebSocketCloseEvent = BaseWebsocketEvent<
    'NETWORK_WEBSOCKET_CLOSE',
    WebSocketCloseInfo
>;

export type ClientWebsocketEvents = WebsocketEvents<{
  CONNECTION_ESTABLISHED: ConnectionEstablishedWebsocketEvent; // RECEIVE
  CLIENT_CONNECTION_ESTABLISHED: ClientConnectionEstablishedWebsocketEvent; // SEND
  CONSOLE_LOG: ConsoleLogWebsocketEvent; // SEND
  NETWORK_HTTP_REQUEST: NetworkHTTPRequestWebsocketEvent; // SEND
  NETWORK_HTTP_RESPONSE: NetworkHTTPResponseWebsocketEvent; // SEND
  NETWORK_WEBSOCKET_OPEN: NetworkWebSocketOpenEvent; // SEND
  NETWORK_WEBSOCKET_MESSAGE: NetworkWebSocketMessageEvent; // SEND
  NETWORK_WEBSOCKET_CLOSE: NetworkWebSocketCloseEvent; // SEND
}>;

export type TeardownWebsocketEvents = WebsocketEvents<{
  CONNECTION_ESTABLISHED: ConnectionEstablishedWebsocketEvent; // RECEIVE
  CLIENT_WEBSOCKET_EVENT: WebsocketEvent; // RECEIVE
}>;
