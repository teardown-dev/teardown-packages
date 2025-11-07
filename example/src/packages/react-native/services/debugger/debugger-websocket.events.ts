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
  'REACT_NATIVE_CLIENT_WEBSOCKET_CONNECTION_ESTABLISHED',
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

export type NetworkRequestInfo = {
  id: number;
  type?: string;
  url?: string;
  method?: string;
  status?: number;
  dataSent?: any;
  responseContentType?: string;
  responseSize?: number;
  requestHeaders?: Record<string, string>;
  responseHeaders?: string;
  response?: Object | string;
  responseURL?: string;
  responseType?: string;
  timeout?: number;
  closeReason?: string;
  messages?: string;
  serverClose?: Object;
  serverError?: Object;
};

export type NetworkRequestPayload = NetworkRequestInfo & {
  type: 'request';
  timestamp: number;
};

export type NetworkResponsePayload = NetworkRequestInfo & {
  type: 'response';
  timestamp: number;
};

export type NetworkRequestWebsocketEvent = BaseWebsocketEvent<
  'NETWORK_REQUEST',
  NetworkRequestPayload | NetworkResponsePayload
>;

export type ClientWebsocketEvents = WebsocketEvents<{
  CONNECTION_ESTABLISHED: ConnectionEstablishedWebsocketEvent; // RECEIVE
  CLIENT_CONNECTION_ESTABLISHED: ClientConnectionEstablishedWebsocketEvent; // SEND
  CONSOLE_LOG: ConsoleLogWebsocketEvent; // SEND
  NETWORK_REQUEST: NetworkRequestWebsocketEvent; // SEND
}>;

export type TeardownWebsocketEvents = WebsocketEvents<{
  CONNECTION_ESTABLISHED: ConnectionEstablishedWebsocketEvent; // RECEIVE
  CLIENT_WEBSOCKET_EVENT: WebsocketEvent; // RECEIVE
}>;
