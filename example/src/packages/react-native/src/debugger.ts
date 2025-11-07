import {NativeModules, Platform} from 'react-native';
import {
  ClientWebsocketEvents,
  ConnectionEstablishedWebsocketEvent,
  WebsocketClient,
  WebsocketClientOptions,
  WebsocketConnectionStatus,
} from '@teardown/websocket';

export type DebuggerStatus = WebsocketConnectionStatus;

export type DebuggerOptions = WebsocketClientOptions;

export class Debugger extends WebsocketClient<ClientWebsocketEvents> {
  constructor(options?: DebuggerOptions) {
    super(options);
  }

  public onEvent(event: ClientWebsocketEvents[keyof ClientWebsocketEvents]) {
    this.logger.log('onEvent', event);
    return event;
  }

  public onConnectionEstablished(event: ConnectionEstablishedWebsocketEvent) {
    this.logger.log('Connection established', event);

    this._client_id = event.client_id;

    this.send('CLIENT_CONNECTION_ESTABLISHED', {
      deviceName: '~~~--- device name here ---~~~',
      platform: Platform.OS,
      platformVersion: Platform.Version,
      reactNativeVersion: Platform.constants.reactNativeVersion,
      isDisableAnimations: Platform.constants.isDisableAnimations ?? false,
      isTesting: Platform.constants.isTesting,
    });
  }

  getHostFromUrl(url: string) {
    const host = url.match(
      /^(?:https?:\/\/)?(\[[^\]]+\]|[^/:\s]+)(?::\d+)?(?:[/?#]|$)/,
    )?.[1];

    if (typeof host !== 'string') {
      throw new Error('Invalid URL - host not found');
    }
    return host;
  }

  getHost() {
    try {
      // https://github.com/facebook/react-native/blob/2a7f969500cef73b621269299619ee1f0ee9521a/packages/react-native/src/private/specs/modules/NativeSourceCode.js#L16
      const scriptURL = NativeModules?.SourceCode?.getConstants().scriptURL;
      if (typeof scriptURL !== 'string') {
        throw new Error('Invalid non-string URL');
      }
      console.log('scriptURL', scriptURL);

      return this.getHostFromUrl(scriptURL);
    } catch (error) {
      const superHost = super.getHost();
      this.logger.warn(
        `Failed to get host: "${error}" - Falling back to ${superHost}`,
      );
      return superHost;
    }
  }

  public send<
    Type extends keyof ClientWebsocketEvents,
    Payload extends ClientWebsocketEvents[Type]['payload'],
  >(type: Type, payload: Payload) {
    super.send(type, payload);
  }
}
