import type { FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";
import type { ConfigT } from "metro-config";
// @ts-ignore
import type MetroServer from "metro/src/Server";
import type { WebSocketServer } from "ws";
import type { WebSocketApiServer } from "./servers/web-socket-api.server";
import { WebSocketDebuggerServer } from "./servers/web-socket-debugger.server";
import { WebSocketDevClientServer } from "./servers/web-socket-dev-client.server";
import type { WebSocketEventsServer } from "./servers/web-socket-events.server";
import { WebSocketHMRServer } from "./servers/web-socket-hmr.server";
import type { WebSocketMessageServer } from "./servers/web-socket-message.server";
import { WebSocketRouter } from "./web-socket-router";
import { WebSocketServerAdapter } from "./web-socket-server-adapter";

declare module "fastify" {
	interface FastifyInstance {
		wss: {
			debuggerServer: WebSocketDebuggerServer;
			devClientServer: WebSocketDevClientServer;
			messageServer: WebSocketMessageServer;
			eventsServer: WebSocketEventsServer;
			apiServer: WebSocketApiServer;
			hmrServer: WebSocketHMRServer;
			deviceConnectionServer: WebSocketServerAdapter;
			debuggerConnectionServer: WebSocketServerAdapter;
			router: WebSocketRouter;
		};
	}
}

/**
 * Defined in @react-native/dev-middleware
 * Reference: https://github.com/facebook/react-native/blob/main/packages/dev-middleware/src/inspector-proxy/InspectorProxy.js
 */
const WS_DEVICE_URL = "/inspector/device";
const WS_DEBUGGER_URL = "/inspector/debug";
const WS_NETWORK_URL = "/inspector/network";

export const wssPlugin = fastifyPlugin<{
	metroConfig: ConfigT;
	metroServer: MetroServer;
	onClientConnected: (platform: string, clientId: string) => void;
	messageServer: WebSocketMessageServer;
	eventsServer: WebSocketEventsServer;
	apiServer: WebSocketApiServer;
	endpoints: {
		[WS_DEVICE_URL]: WebSocketServer;
		[WS_DEBUGGER_URL]: WebSocketServer;
		[WS_NETWORK_URL]: WebSocketServer;
	};
}>(
	async (
		instance,
		{
			metroConfig,
			metroServer,
			onClientConnected,
			endpoints,
			messageServer,
			eventsServer,
			apiServer,
		},
	) => {
		const router = new WebSocketRouter(instance);

		const debuggerServer = new WebSocketDebuggerServer(instance);
		const devClientServer = new WebSocketDevClientServer(instance);
		const hmrServer = new WebSocketHMRServer(instance, {
			metroConfig,
			metroServer,
			onClientConnected,
		});

		// @react-native/dev-middleware servers
		const deviceConnectionServer = new WebSocketServerAdapter(
			instance,
			WS_DEVICE_URL,
			endpoints[WS_DEVICE_URL],
		);

		const debuggerConnectionServer = new WebSocketServerAdapter(
			instance,
			WS_DEBUGGER_URL,
			endpoints[WS_DEBUGGER_URL],
		);

		const networkConnectionServer = new WebSocketServerAdapter(
			instance,
			WS_NETWORK_URL,
			endpoints[WS_NETWORK_URL],
		);

		router.registerServer(debuggerServer);
		router.registerServer(devClientServer);
		router.registerServer(messageServer);
		router.registerServer(eventsServer);
		router.registerServer(apiServer);
		router.registerServer(hmrServer);
		router.registerServer(deviceConnectionServer);
		router.registerServer(debuggerConnectionServer);
		router.registerServer(networkConnectionServer);

		instance.decorate("wss", {
			debuggerServer,
			devClientServer,
			messageServer,
			eventsServer,
			apiServer,
			hmrServer,
			deviceConnectionServer,
			debuggerConnectionServer,
			router,
		});
	},
	{
		name: "wss-plugin",
	},
);
