import type { NextFunction, IncomingMessage } from "connect";
import type * as http from "node:http";
import type { Middleware } from "metro-config";
import type { WebSocketServer } from "ws";

export type RequestHandler = (
	req: IncomingMessage,
	res: http.ServerResponse,
	next: NextFunction,
) => void;

export interface WebsocketEndpoints {
	[key: string]: WebSocketServer;
}

export interface MiddlewareOptions {
	port: number;
	projectRoot?: string;
}

export interface MiddlewareResult {
	middleware: RequestHandler;
	websocketEndpoints?: WebsocketEndpoints;
}

export abstract class BaseMiddlewareManager {
	protected port: number;
	protected projectRoot?: string;
	protected websocketEndpoints: WebsocketEndpoints = {};

	constructor(options: MiddlewareOptions) {
		this.port = options.port;
		this.projectRoot = options.projectRoot;
	}

	abstract createRequestHandler(
		middleware: RequestHandler,
		metroMiddleware: Middleware,
	): RequestHandler;

	public getWebsocketEndpoints(): WebsocketEndpoints {
		return this.websocketEndpoints;
	}

	protected handleError(err: Error | undefined, next: NextFunction): boolean {
		if (err) {
			next(err);
			return true;
		}
		return false;
	}
}
