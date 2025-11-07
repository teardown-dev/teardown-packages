// @ts-ignore
import XHRInterceptor from 'react-native/Libraries/Network/XHRInterceptor';
import type {Plugin, TeardownClient} from '../teardown.client';
import {Logger} from '@teardown/logger';
import {Util} from '@teardown/util';
import type {HTTPRequestInfo, HTTPResponseInfo} from '@teardown/websocket';

interface ExtendedXMLHttpRequest extends XMLHttpRequest {
  _id: number;
}

export type HTTPPluginOptions = {
  ignoreURLs?: string[];
};

export class HTTPPlugin implements Plugin {
  private logger = new Logger('HTTPPlugin');
  private client: TeardownClient<any> | null = null;
  private requests: Map<number, HTTPRequestInfo> = new Map();
  private ignoreURLs: string[];

  constructor(options: HTTPPluginOptions = {}) {
    this.ignoreURLs = options.ignoreURLs || [];
  }

  install(client: TeardownClient<any>): void {
    this.client = client;
    this.setupXHRInterceptor();
  }

  private setupXHRInterceptor(): void {
    if (XHRInterceptor.isInterceptorEnabled()) {
      this.logger.warn(
        'XHRInterceptor is already enabled by another library, disable it or run this first when your app loads',
      );
      this.disableInterception();
    }

    XHRInterceptor.setOpenCallback(this.xhrOpenCallback);
    XHRInterceptor.setRequestHeaderCallback(this.xhrRequestHeaderCallback);
    XHRInterceptor.setSendCallback(this.xhrSendCallback);
    XHRInterceptor.setResponseCallback(this.xhrResponseCallback);

    XHRInterceptor.enableInterception();
  }

  private shouldIgnoreURL(url: string): boolean {
    return this.ignoreURLs.some(ignoreUrl => url.includes(ignoreUrl));
  }

  private xhrOpenCallback = (
    method: string,
    url: string,
    xhr: ExtendedXMLHttpRequest,
  ): void => {
    if (this.shouldIgnoreURL(url)) {
      return;
    }

    const requestId = Util.generateUUID();

    const requestInfo: HTTPRequestInfo = {
      id: requestId,
      url,
      method,
      headers: {'TD-Request-ID': requestId},
      timestamp: Date.now(),
    };

    this.requests.set(xhr._id, requestInfo);
  };

  private xhrRequestHeaderCallback = (
    header: string,
    value: string,
    xhr: ExtendedXMLHttpRequest,
  ): void => {
    const request = this.requests.get(xhr._id);
    if (request) {
      request.headers[header] = value;
    }
  };

  private xhrSendCallback = (data: any, xhr: ExtendedXMLHttpRequest): void => {
    const request = this.requests.get(xhr._id);
    if (request) {
      // Set our custom header here, just before the request is sent
      xhr.setRequestHeader('TD-Request-ID', request.id);

      request.body = typeof data === 'string' ? data : JSON.stringify(data);
      this.sendRequestEvent(request);
    }
  };

  private xhrResponseCallback = (
    status: number,
    timeout: number,
    response: string,
    responseURL: string,
    responseType: XMLHttpRequestResponseType,
    xhr: ExtendedXMLHttpRequest,
  ): void => {
    const request = this.requests.get(xhr._id);
    if (request) {
      const responseInfo: HTTPResponseInfo = {
        id: request.id,
        status,
        headers: this.parseResponseHeaders(xhr.getAllResponseHeaders()),
        body: response,
        timestamp: Date.now(),
      };
      this.sendResponseEvent(responseInfo);
      this.requests.delete(xhr._id);
    }
  };

  private parseResponseHeaders(headersString: string): Record<string, string> {
    const headersObject: Record<string, string> = {};
    if (headersString) {
      const headerPairs = headersString.split('\u000d\u000a');
      for (let i = 0; i < headerPairs.length; i++) {
        const headerPair = headerPairs[i];
        const index = headerPair.indexOf('\u003a\u0020');
        if (index > 0) {
          const key = headerPair.substring(0, index);
          const val = headerPair.substring(index + 2);
          headersObject[key] = val;
        }
      }
    }
    return headersObject;
  }

  private sendRequestEvent(request: HTTPRequestInfo): void {
    if (this.client && this.client.debugger) {
      this.client.debugger.send('NETWORK_HTTP_REQUEST', request);
    }
  }

  private sendResponseEvent(response: HTTPResponseInfo): void {
    if (this.client && this.client.debugger) {
      this.client.debugger.send('NETWORK_HTTP_RESPONSE', response);
    }
  }

  disableInterception(): void {
    XHRInterceptor.disableInterception();
    this.requests.clear();
  }
}
