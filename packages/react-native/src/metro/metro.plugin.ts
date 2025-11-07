import path from "node:path";
import chokidar from "chokidar";
import type { MetroConfig } from "metro-config";
import { createDevMiddleware } from "@react-native/dev-middleware";

export function createDebugMiddleware(metroBundler: MetroBundlerDevServer) {
	const { middleware, websocketEndpoints } = createDevMiddleware({
		projectRoot: metroBundler.projectRoot,
		serverBaseUrl: metroBundler
			.getUrlCreator()
			.constructUrl({ scheme: "http", hostType: "lan" }),
		logger: createLogger(chalk.bold("Debug:")),
		unstable_customInspectorMessageHandler: createHandlersFactory(),
		unstable_experiments: {
			// Enable the Network tab in React Native DevTools
			enableNetworkInspector: true,
			// Only enable opening the browser version of React Native DevTools when debugging.
			// This is useful when debugging the React Native DevTools by going to `/open-debugger` in the browser.
			enableOpenDebuggerRedirect: env.EXPO_DEBUG,
		},
	});

	// NOTE(cedric): add a temporary websocket to handle Network-related CDP events
	websocketEndpoints["/inspector/network"] = createNetworkWebsocket(
		websocketEndpoints["/inspector/debug"],
	);

	return {
		debugMiddleware: middleware,
		debugWebsocketEndpoints: websocketEndpoints,
	};
}

function createLogger(
	logPrefix: string,
): Parameters<
	typeof import("@react-native/dev-middleware").createDevMiddleware
>[0]["logger"] {
	return {
		info: (...args) => Log.log(logPrefix, ...args),
		warn: (...args) => Log.warn(logPrefix, ...args),
		error: (...args) => Log.error(logPrefix, ...args),
	};
}
