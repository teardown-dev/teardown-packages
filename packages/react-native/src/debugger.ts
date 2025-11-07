import {Platform} from 'react-native';
import {
  ClientWebsocketEvents,
  ConnectionEstablishedWebsocketEvent,
  WebsocketClient,
  WebsocketConnectionStatus,
} from '@teardown/websocket';

export type DebuggerStatus = WebsocketConnectionStatus;

export class Debugger extends WebsocketClient<ClientWebsocketEvents> {
  public onEvent(event: ClientWebsocketEvents[keyof ClientWebsocketEvents]) {
    this.logger.log('onEvent', event);
    return event;
  }

  public onConnectionEstablished(event: ConnectionEstablishedWebsocketEvent) {
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

  getHostFromUrl(url: string) {
    const host = url.match(
      /^(?:https?:\/\/)?(\[[^\]]+\]|[^/:\s]+)(?::\d+)?(?:[/?#]|$)/,
    )?.[1];

    if (typeof host !== 'string') {
      throw new Error('Invalid URL - host not found');
    }
    return host;
  }

  public send<
    Type extends keyof ClientWebsocketEvents,
    Payload extends ClientWebsocketEvents[Type]['payload'],
  >(type: Type, payload: Payload) {
    super.send(type, payload);
  }
}
