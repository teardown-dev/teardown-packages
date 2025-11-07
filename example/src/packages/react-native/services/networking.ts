// @ts-ignore
import XHRInterceptor from 'react-native/Libraries/Network/XHRInterceptor';
// @ts-ignore
import WebSocketInterceptor from 'react-native/Libraries/WebSocket/WebSocketInterceptor';

import type {Plugin, TeardownClient} from '../teardown.client';
import {NetworkRequestPayload} from './debugger';
import {Logger} from '@teardown/logger';

type NetworkRequestInfo = {
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

export class NetworkingPlugin implements Plugin {
  private logger = new Logger('NetworkingPlugin');

  private client: TeardownClient | null = null;
  private requests: Map<number, NetworkRequestInfo> = new Map();
  private xhrIdMap: Map<number, number> = new Map();
  private socketIdMap: Map<string, number> = new Map();
  private nextXHRId = 0;

  constructor() {}

  install(client: TeardownClient): void {
    this.client = client;
    this.setupXHRInterceptor();
    this.setupWebSocketInterceptor();
  }

  private setupXHRInterceptor(): void {
    if (XHRInterceptor.isInterceptorEnabled()) {
      this.logger.warn(
        'XHRInterceptor is already enabled by another library, disable it or run this first when your app loads',
      );
      return;
    }

    XHRInterceptor.setOpenCallback(this.xhrOpenCallback);
    XHRInterceptor.setRequestHeaderCallback(this.xhrRequestHeaderCallback);
    XHRInterceptor.setSendCallback(this.xhrSendCallback);
    XHRInterceptor.setHeaderReceivedCallback(this.xhrHeaderReceivedCallback);
    XHRInterceptor.setResponseCallback(this.xhrResponseCallback);

    XHRInterceptor.enableInterception();
  }

  private setupWebSocketInterceptor(): void {
    if (WebSocketInterceptor.isInterceptorEnabled()) {
      this.logger.warn(
        'WebSocketInterceptor is already enabled by another library, disable it or run this first when your app loads',
      );
      return;
    }

    WebSocketInterceptor.setConnectCallback(this.wsConnectCallback);
    WebSocketInterceptor.setCloseCallback(this.wsCloseCallback);
    WebSocketInterceptor.setSendCallback(this.wsSendCallback);
    WebSocketInterceptor.setOnMessageCallback(this.wsOnMessageCallback);
    WebSocketInterceptor.setOnCloseCallback(this.wsOnCloseCallback);
    WebSocketInterceptor.setOnErrorCallback(this.wsOnErrorCallback);

    WebSocketInterceptor.enableInterception();
  }

  private xhrOpenCallback = (method: string, url: string, xhr: any): void => {
    xhr._id = this.nextXHRId++;
    const requestInfo: NetworkRequestInfo = {
      id: xhr._id,
      type: 'XMLHttpRequest',
      method,
      url,
    };
    this.requests.set(xhr._id, requestInfo);
    this.xhrIdMap.set(xhr._id, xhr._id);
    this.sendRequestEvent(requestInfo);
  };

  private xhrRequestHeaderCallback = (
    header: string,
    value: string,
    xhr: any,
  ): void => {
    const request = this.requests.get(xhr._id);
    if (!request) {
      return;
    }

    if (!request.requestHeaders) {
      request.requestHeaders = {};
    }
    request.requestHeaders[header] = value;
    this.sendRequestEvent(request);
  };

  private xhrSendCallback = (data: any, xhr: any): void => {
    const request = this.requests.get(xhr._id);
    if (!request) {
      return;
    }

    request.dataSent = data;
    this.sendRequestEvent(request);
  };

  private xhrHeaderReceivedCallback = (
    type: string,
    size: number,
    responseHeaders: string,
    xhr: any,
  ): void => {
    const request = this.requests.get(xhr._id);
    if (!request) {
      return;
    }

    request.responseContentType = type;
    request.responseSize = size;
    request.responseHeaders = responseHeaders;
    this.sendRequestEvent(request);
  };

  private xhrResponseCallback = (
    status: number,
    timeout: number,
    response: any,
    responseURL: string,
    responseType: string,
    xhr: any,
  ): void => {
    const request = this.requests.get(xhr._id);
    if (!request) {
      return;
    }

    request.status = status;
    request.timeout = timeout;
    request.response = response;
    request.responseURL = responseURL;
    request.responseType = responseType;
    this.sendResponseEvent(request);

    // Remove the completed request
    this.requests.delete(xhr._id);
    this.xhrIdMap.delete(xhr._id);
  };

  private wsConnectCallback = (
    url: string,
    protocols: string | string[],
    options: any,
    socketId: string,
  ): void => {
    const requestId = this.nextXHRId++;
    const requestInfo: NetworkRequestInfo = {
      id: requestId,
      type: 'WebSocket',
      url,
      method: 'CONNECT',
    };
    this.requests.set(requestId, requestInfo);
    this.socketIdMap.set(socketId, requestId);
    this.sendRequestEvent(requestInfo);
  };

  private wsCloseCallback = (
    statusCode: number,
    closeReason: string,
    socketId: string,
  ): void => {
    const requestId = this.socketIdMap.get(socketId);
    if (requestId === undefined) {
      return;
    }

    const request = this.requests.get(requestId);
    if (!request) {
      return;
    }

    request.status = statusCode;
    request.closeReason = closeReason;
    this.sendResponseEvent(request);

    // Remove the completed WebSocket request
    this.requests.delete(requestId);
    this.socketIdMap.delete(socketId);
  };

  private wsSendCallback = (data: any, socketId: string): void => {
    const requestId = this.socketIdMap.get(socketId);
    if (requestId === undefined) {
      return;
    }

    const request = this.requests.get(requestId);
    if (!request) {
      return;
    }

    if (!request.messages) {
      request.messages = '';
    }
    request.messages += `Sent: ${JSON.stringify(data)}\n`;
    this.sendRequestEvent(request);
  };

  private wsOnMessageCallback = (socketId: string, message: string): void => {
    const requestId = this.socketIdMap.get(socketId);
    if (requestId === undefined) {
      return;
    }

    const request = this.requests.get(requestId);
    if (!request) {
      return;
    }

    if (!request.messages) {
      request.messages = '';
    }
    request.messages += `Received: ${JSON.stringify(message)}\n`;
    this.sendResponseEvent(request);
  };

  private wsOnCloseCallback = (socketId: string, message: Object): void => {
    const requestId = this.socketIdMap.get(socketId);
    if (requestId === undefined) {
      return;
    }

    const request = this.requests.get(requestId);
    if (!request) {
      return;
    }

    request.serverClose = message;
    this.sendResponseEvent(request);

    // Remove the closed WebSocket request
    this.requests.delete(requestId);
    this.socketIdMap.delete(socketId);
  };

  private wsOnErrorCallback = (socketId: string, message: Object): void => {
    const requestId = this.socketIdMap.get(socketId);
    if (requestId === undefined) {
      return;
    }

    const request = this.requests.get(requestId);
    if (!request) {
      return;
    }

    request.serverError = message;
    this.sendResponseEvent(request);
  };

  private sendRequestEvent(request: NetworkRequestInfo): void {
    if (this.client && this.client.debugger) {
      this.client.debugger.send('NETWORK_REQUEST', {
        ...request,
        type: 'request',
        timestamp: Date.now(),
      } as NetworkRequestPayload);
    }
  }

  private sendResponseEvent(request: NetworkRequestInfo): void {
    if (this.client && this.client.debugger) {
      this.client.debugger.send('NETWORK_REQUEST', {
        ...request,
        type: 'response',
        timestamp: Date.now(),
      });
    }
  }

  getRequests(): NetworkRequestInfo[] {
    return Array.from(this.requests.values());
  }

  clearRequests(): void {
    this.requests.clear();
    this.xhrIdMap.clear();
    this.socketIdMap.clear();
  }

  disableInterception(): void {
    XHRInterceptor.disableInterception();
    WebSocketInterceptor.disableInterception();
    this.clearRequests();
  }
}
