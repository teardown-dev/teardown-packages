import type { WebSocketServer } from "ws";
import type { RequestHandler } from "./middlewares/base";

export interface MetroWebsocketEndpoints {
	[key: string]: WebSocketServer;
}

export interface MetroMiddlewareResult {
	middleware: RequestHandler;
	websocketEndpoints?: MetroWebsocketEndpoints;
}
