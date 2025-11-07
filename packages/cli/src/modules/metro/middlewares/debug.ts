import type { Middleware } from "metro-config";
import type { NextHandleFunction } from "connect";

interface DebugMiddlewareOptions {
	port: number;
	projectRoot: string;
}

export function createDebugMiddleware(
	options: DebugMiddlewareOptions,
): NextHandleFunction {
	return (req, res, next) => {
		console.log(`[Debug] ${req.method} ${req.url}`);
		next();
	};
}
