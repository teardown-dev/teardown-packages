import type { NextFunction, IncomingMessage } from "connect";
import type * as http from "node:http";
import type { Middleware } from "metro-config";
import {
	BaseMiddlewareManager,
	type MiddlewareOptions,
	type RequestHandler,
} from "./base";
import connect from "connect";

interface MetroMiddleware {
	name: string;
	middleware: RequestHandler;
	order?: number;
}

export class MiddlewareManager extends BaseMiddlewareManager {
	private middlewares: MetroMiddleware[] = [];
	private app: connect.Server;
	public websocketEndpoints: Record<string, any> = {};

	constructor(opts: MiddlewareOptions) {
		super(opts);
		this.app = connect();
	}

	public use(name: string, middleware: RequestHandler, order?: number): this {
		this.middlewares.push({ name, middleware, order });
		// Sort middlewares by order if specified
		this.middlewares.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
		return this;
	}

	public remove(name: string): this {
		this.middlewares = this.middlewares.filter((m) => m.name !== name);
		return this;
	}

	public clear(): this {
		this.middlewares = [];
		return this;
	}

	public getMiddleware(name: string): RequestHandler | undefined {
		return this.middlewares.find((m) => m.name === name)?.middleware;
	}

	public enhanceMiddleware(metroMiddleware: Middleware): RequestHandler {
		// Apply all middlewares in order
		this.middlewares.forEach(({ middleware }) => {
			this.app.use(middleware);
		});

		return (
			req: IncomingMessage,
			res: http.ServerResponse,
			next: NextFunction,
		) => {
			this.app(req, res, (err?: Error) => {
				if (err) {
					next(err);
					return;
				}
				// @ts-ignore
				metroMiddleware(req, res, next);
			});
		};
	}

	public createRequestHandler(): RequestHandler {
		return (req, res, next) => next();
	}

	public getWebsocketEndpoints(): Record<string, any> {
		return this.websocketEndpoints;
	}

	public handleError(err: Error | undefined, next: NextFunction): boolean {
		console.error(err);
		return true;
	}
}

export function createMetroMiddlewareManager(
	options: MiddlewareOptions,
): MiddlewareManager {
	return new MiddlewareManager(options);
}
