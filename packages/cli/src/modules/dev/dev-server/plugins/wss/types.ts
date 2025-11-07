import type { IncomingMessage } from 'node:http';
import type { Socket } from 'node:net';


export interface WebSocketServerInterface {
  shouldUpgrade(pathname: string): boolean;
  upgrade(request: IncomingMessage, socket: Socket, head: Buffer): void;
}
