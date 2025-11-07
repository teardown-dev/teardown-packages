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
  ignoreURLs?: RegExp[];
};

export class HTTPPlugin implements Plugin {
  private logger = new Logger('HTTPPlugin');
  private client: TeardownClient<any> | null = null;
  private requests: Map<number, HTTPRequestInfo> = new Map();
  private ignoreURLs: RegExp[];

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
          'XHRInterceptor is already enabled by another library. Disable it or run this plugin first when your app loads.',
      );
    }

    XHRInterceptor.setOpenCallback(this.xhrOpenCallback);
    XHRInterceptor.setRequestHeaderCallback(this.xhrRequestHeaderCallback);
    XHRInterceptor.setSendCallback(this.xhrSendCallback);
    XHRInterceptor.setResponseCallback(this.xhrResponseCallback);

    XHRInterceptor.enableInterception();
  }

  private shouldIgnoreURL(url: string): boolean {
    return this.ignoreURLs.some(ignoreRegex => ignoreRegex.test(url));
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

      request.body = this.serializeRequestBody(data);
      this.sendRequestEvent(request);
    }
  };

  private serializeRequestBody(data: any): string {
    if (typeof data === 'string') {
      return data;
    }
    try {
      return JSON.stringify(data);
    } catch (error) {
      this.logger.warn('Failed to stringify request body', error);
      return '[Unable to serialize request body]';
    }
  }

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
        body: this.parseResponseBody(response, responseType),
        timestamp: Date.now(),
      };
      this.sendResponseEvent(responseInfo);
      this.requests.delete(xhr._id);
    }
  };

  private parseResponseHeaders(headersString: string): Record<string, string> {
    const headersObject: Record<string, string> = {};
    if (headersString) {
      const headerPairs = headersString.trim().split(/[\r\n]+/);
      headerPairs.forEach(headerPair => {
        const [key, value] = headerPair.split(': ');
        headersObject[key] = value;
      });
    }
    return headersObject;
  }

  private parseResponseBody(response: string, responseType: XMLHttpRequestResponseType): string {
    if (responseType === 'json') {
      try {
        return JSON.stringify(JSON.parse(response), null, 2);
      } catch (error) {
        this.logger.warn('Failed to parse JSON response', error);
      }
    }
    return response;
  }

  private sendRequestEvent(request: HTTPRequestInfo): void {
    if (this.client?.debugger) {
      this.client.debugger.send('NETWORK_HTTP_REQUEST', request);
    }
  }

  private sendResponseEvent(response: HTTPResponseInfo): void {
    if (this.client?.debugger) {
      this.client.debugger.send('NETWORK_HTTP_RESPONSE', response);
    }
  }

  disableInterception(): void {
    XHRInterceptor.disableInterception();
    this.requests.clear();
  }
}
