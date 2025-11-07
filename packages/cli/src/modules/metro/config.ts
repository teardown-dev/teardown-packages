import type { MetroConfig, Middleware } from "metro-config";
import { createMetroMiddlewareManager } from "./middlewares/manager";
import { createDebugMiddleware } from "./middlewares/debug";

function getServerConfig(): MetroConfig["server"] {
	const middlewareManager = createMetroMiddlewareManager({
		port: 8081,
		projectRoot: process.cwd(),
	});

	// Add debug middleware
	middlewareManager.use(
		"debug",
		createDebugMiddleware({
			port: 8081,
			projectRoot: process.cwd(),
		}),
		1,
	);

	return {
		enhanceMiddleware: (metroMiddleware: Middleware) => {
			return middlewareManager.enhanceMiddleware(metroMiddleware);
		},
	};
}

export function getMetroConfig(): MetroConfig {
	return {
		server: getServerConfig(),
	};
}
