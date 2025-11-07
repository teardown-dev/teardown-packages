// @ts-ignore
import XHRInterceptor from 'react-native/Libraries/Network/XHRInterceptor';
import type {Plugin, TeardownClient} from '../teardown.client';
import {Logger} from '../../../../../../packages/logger';
import {Util} from '../../../../../../packages/util';
import type {
  HTTPRequestInfo,
  RequestMethod,
} from '../../../../../../packages/websocket';

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

    const HTTPRequestInfo: HTTPRequestInfo = {
      id: requestId,
      type: 'XMLHttpRequest',
      url,
      method: method as RequestMethod,
      requestHeaders: {'TD-Request-ID': requestId},
      startTime: Date.now(),
      updatedAt: Date.now(),
    };

    this.requests.set(xhr._id, HTTPRequestInfo);
  };

  private xhrRequestHeaderCallback = (
    header: string,
    value: string,
    xhr: ExtendedXMLHttpRequest,
  ): void => {
    const request = this.requests.get(xhr._id);
    if (request) {
      request.requestHeaders[header] = value;
      request.updatedAt = Date.now();
    }
  };

  private xhrSendCallback = (data: any, xhr: ExtendedXMLHttpRequest): void => {
    const request = this.requests.get(xhr._id);
    if (request) {
      xhr.setRequestHeader('TD-Request-ID', request.id);

      request.dataSent = this.serializeRequestBody(data);
      request.updatedAt = Date.now();
      this.sendHTTPEvent(request);
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
      request.status = status;
      request.responseHeaders = this.parseResponseHeaders(
        xhr.getAllResponseHeaders(),
      );
      request.response = this.parseResponseBody(response, responseType);
      request.responseURL = responseURL;
      request.responseType = responseType;
      request.timeout = timeout;
      request.endTime = Date.now();
      request.updatedAt = Date.now();

      this.sendHTTPEvent(request);
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

  private parseResponseBody(
    response: string,
    responseType: XMLHttpRequestResponseType,
  ): string {
    if (responseType === 'json') {
      try {
        return JSON.stringify(JSON.parse(response), null, 2);
      } catch (error) {
        this.logger.warn('Failed to parse JSON response', error);
      }
    }
    return response;
  }

  private sendHTTPEvent(httpRequestInfo: HTTPRequestInfo): void {
    if (this.client?.debugger) {
      this.client.debugger.send('NETWORK_HTTP_REQUEST', httpRequestInfo);
    }
  }

  disableInterception(): void {
    XHRInterceptor.disableInterception();
    this.requests.clear();
  }
}
