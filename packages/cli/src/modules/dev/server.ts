import {
	createDevServerMiddleware,
	indexPageMiddleware,
} from "@react-native-community/cli-server-api";
import { createDevMiddleware } from "@react-native/dev-middleware";
import { getDefaultConfig, mergeConfig } from "@react-native/metro-config";
import connect from "connect";
import Metro from "metro";
import type { ConfigT } from "metro-config";
import http from "node:http";
// @ts-ignore
import MetroHmrServer from "metro/src/HmrServer";
// @ts-ignore
import createWebsocketServer from "metro/src/lib/createWebsocketServer";
import type { Server as WebSocketServer } from "ws";
import { DevServerChecker, DevServerStatusEnum } from "./dev-server-checker";
import type { MessageSocket } from "./menu/keyboard-handler";
import { TeardownTerminalReporter } from "./terminal/terminal.reporter";
import type Server from "metro/src/Server";

export type DevServerOptions = {
	port: number;
	host: string;
	projectRoot: string;
	entryFile: string;
	dev?: boolean;
};

// websocketEndpoints: {
// 	'/debugger-proxy': import("ws").Server;
// 	'/message': import("ws").Server;
// 	'/events': import("ws").Server;
// };
// debuggerProxyEndpoint: {
// 	server: import("ws").Server;
// 	isDebuggerConnected: () => boolean;
// };
// messageSocketEndpoint: {
// 	server: import("ws").Server;
// 	broadcast: (method: string, params?: Record<string, any> | undefined) => void;
// };
// eventsSocketEndpoint: {
// 	server: import("ws").Server;
// 	reportEvent: (event: any) => void;
// };
// middleware: connect.Server;

type EventsSocket = ReturnType<
	typeof createDevServerMiddleware
>["eventsSocketEndpoint"];
type DebuggerProxyEndpoint = ReturnType<
	typeof createDevServerMiddleware
>["debuggerProxyEndpoint"];

export class DevServer {
	devServerChecker: DevServerChecker;
	terminalReporter: TeardownTerminalReporter;

	messageSocket: MessageSocket | null = null;
	eventsSocket: EventsSocket | null = null;
	debuggerProxy: DebuggerProxyEndpoint | null = null;

	constructor(readonly options: DevServerOptions) {
		this.devServerChecker = new DevServerChecker(this.options);
		this.terminalReporter = new TeardownTerminalReporter(this);
	}

	private async loadMetroConfig(): Promise<ConfigT> {
		const config = await Metro.loadConfig({
			cwd: this.options.projectRoot,
			...this.options,
		});

		const reactNativeConfig = getDefaultConfig(this.options.projectRoot);

		return mergeConfig(reactNativeConfig, config);
	}

	private async getMetroConfig(): Promise<ConfigT> {
		const config = await this.loadMetroConfig();

		return mergeConfig(config, {
			reporter: this.terminalReporter,
		});
	}

	public getServerUrl() {
		return `http://${this.options.host}:${this.options.port}`;
	}

	private createDevMiddleware() {
		return createDevMiddleware({
			projectRoot: this.options.projectRoot,
			serverBaseUrl: this.getServerUrl(),
		});
	}

	private createDevServerMiddleware(watchFolders: string[]) {
		const {
			middleware: devServerMiddleware,
			websocketEndpoints: devServerWebsocketEndpoints,
			messageSocketEndpoint,
			eventsSocketEndpoint,
			debuggerProxyEndpoint,
		} = createDevServerMiddleware({
			host: this.options.host,
			port: this.options.port,
			watchFolders,
		});

		this.messageSocket = {
			...messageSocketEndpoint,
			broadcast: (type, params) =>
				messageSocketEndpoint.broadcast(type, params as any),
		};

		this.eventsSocket = eventsSocketEndpoint;
		this.debuggerProxy = debuggerProxyEndpoint;

		return {
			devServerMiddleware,
			devServerWebsocketEndpoints,
		};
	}

	private async runServer() {
		const app = connect();

		const metroConfig = await this.getMetroConfig();

		const { devServerMiddleware, devServerWebsocketEndpoints } =
			this.createDevServerMiddleware([...metroConfig.watchFolders]);

		const {
			middleware: devMiddleware,
			websocketEndpoints: devWebsocketEndpoints,
		} = this.createDevMiddleware();

		const websocketEndpoints: Record<string, WebSocketServer> = {
			...devServerWebsocketEndpoints,
			...devWebsocketEndpoints,
		};

		const serverInstance = await Metro.createConnectMiddleware(metroConfig, {
			watch: true,
			onBundleBuilt: (bundlePath) => {
				console.log("bundle built", bundlePath);
			},
		});

		app.use(serverInstance.middleware);
		app.use(devServerMiddleware);
		app.use(indexPageMiddleware);
		app.use(devMiddleware);

		app.on("open", () => {
			console.log("Dev server opened...");
		});

		app.on("close", () => {
			console.log("Closing dev server...");
		});

		app.on("error", (error) => {
			console.error("Dev server error:", error);
		});

		app.on("listening", () => {
			console.log(`Dev server running at ${this.getServerUrl()}`);
		});

		app.on("clientError", (error, socket) => {
			console.error("Dev server client error:", error);
		});

		app.on("upgrade", (request, socket, head) => {
			console.log("upgrade", request.url);
			if (!request.url) {
				socket.destroy();
				return;
			}

			const pathname = new URL(request.url, `http://${request.headers.host}`)
				.pathname;

			console.log("pathname", pathname);

			if (pathname != null && websocketEndpoints[pathname]) {
				websocketEndpoints[pathname].handleUpgrade(
					request,
					socket,
					head,
					(ws) => {
						websocketEndpoints[pathname].emit("connection", ws, request);
					},
				);
			} else {
				socket.destroy();
			}
		});

		const httpServer = http.createServer(app);

		httpServer.on("error", (error) => {
			console.error("Dev server error:", error);
			// if ("code" in error && error.code === "EADDRINUSE") {
			// 	// If `Error: listen EADDRINUSE: address already in use :::8081` then print additional info
			// 	// about the process before throwing.
			// 	const info = getRunningProcess(this.options.port);
			// 	if (info) {
			// 		console.error(
			// 			`Port ${this.options.port} is busy running ${info.command} in: ${info.directory}`,
			// 		);
			// 	}
			// }

			// if (onError) {
			// 	onError(error);
			// }
			serverInstance.end();
		});

		httpServer.timeout = 0;

		httpServer.on("close", () => {
			serverInstance.end();
		});

		const originalClose = httpServer.close.bind(httpServer);

		httpServer.close = function closeHttpServer(callback) {
			originalClose(callback);

			// Close all websocket servers, including possible client connections (see: https://github.com/websockets/ws/issues/2137#issuecomment-1507469375)
			for (const endpoint of Object.values(
				websocketEndpoints,
			) as WebSocketServer[]) {
				endpoint.close();
				endpoint.clients.forEach((client) => client.terminate());
			}

			// Forcibly close active connections
			this.closeAllConnections();
			return this;
		};

		return new Promise<{
			server: http.Server;
			hmrServer: MetroHmrServer;
			metro: Server;
		}>((resolve, reject) => {
			httpServer.on("error", (error) => {
				reject(error);
			});

			httpServer.listen(this.options.port, this.options.host, () => {
				//   if (onReady) {
				// 	onReady(httpServer);
				//   }

				const hmrServer = new MetroHmrServer(
					serverInstance.metroServer.getBundler(),
					serverInstance.metroServer.getCreateModuleId(),
					metroConfig,
				);

				Object.assign(websocketEndpoints, {
					"/hot": createWebsocketServer({
						websocketServer: hmrServer,
					}),
				});

				httpServer.on("upgrade", (request, socket, head) => {
					if (!request.url) {
						console.log("no url", request);
						// socket.destroy();
						return;
					}

					const pathname = new URL(
						request.url,
						`http://${request.headers.host}`,
					).pathname;
					if (pathname != null && websocketEndpoints[pathname]) {
						websocketEndpoints[pathname].handleUpgrade(
							request,
							socket,
							head,
							(ws) => {
								websocketEndpoints[pathname].emit("connection", ws, request);
							},
						);
					} else {
						socket.destroy();
					}
				});

				resolve({
					server: httpServer,
					hmrServer,
					metro: serverInstance.metroServer,
				});
			});
		});
	}

	private async checkServer() {
		const status = await this.devServerChecker.getServerStatus();

		const successStatuses = [
			DevServerStatusEnum.MATCHED_SERVER_RUNNING,
			DevServerStatusEnum.NOT_RUNNING,
		];

		if (!successStatuses.includes(status)) {
			throw new Error(`Dev server status check failed: ${status}`);
		}

		return status;
	}

	public async start() {
		await this.checkServer();
		const server = await this.runServer();

		return {
			server,
			stop: async () => {
				server.server.close();
			},
		};
	}
}
