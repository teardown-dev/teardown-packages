import fastifyCompress from "@fastify/compress";
import cors from "@fastify/cors";
import fastifyMiddie from "@fastify/middie";
import fastifySensible from "@fastify/sensible";
import {
	openStackFrameInEditorMiddleware,
	openURLMiddleware,
} from "@react-native-community/cli-server-api";
import { createDevMiddleware } from "@react-native/dev-middleware";
import type {
	CustomMessageHandler,
	CustomMessageHandlerConnection,
} from "@react-native/dev-middleware/dist/inspector-proxy/CustomMessageHandler";
import { Writable } from "node:stream";
// @ts-ignore
import type { JSONSerializable } from "@react-native/dev-middleware/dist/inspector-proxy/types";
import { getDefaultConfig, mergeConfig } from "@react-native/metro-config";
import Fastify, { type FastifyInstance } from "fastify";
import Metro from "metro";
import type { ConfigT } from "metro-config";
import type { TerminalReportableEvent } from "metro/src/lib/TerminalReporter";
import { KeyboardHandlerManager } from "../dev-menu/keyboard-handler";
import { TeardownTerminalReporter } from "../terminal/terminal.reporter";
import { devtoolsPlugin } from "./plugins/devtools.plugin";
import { multipartPlugin } from "./plugins/multipart.plugin";
import {
	symbolicatePlugin,
	type SymbolicateReply,
	type SymbolicateRequest,
} from "./plugins/sybmolicate.plugin";
import { systracePlugin } from "./plugins/systrace.plugin";
import { wssPlugin } from "./plugins/wss";
import { WebSocketApiServer } from "./plugins/wss/servers/web-socket-api.server";
import { WebSocketEventsServer } from "./plugins/wss/servers/web-socket-events.server";
import { WebSocketMessageServer } from "./plugins/wss/servers/web-socket-message.server";

export type DevServerOptions = {
	projectRoot: string;
	host: string;
	port: number;
	logRequests: boolean;
	https?: {
		key: string;
		cert: string;
	};
};

export class DevServer {
	public terminalReporter: TeardownTerminalReporter;

	private stream: Writable;
	private instance: FastifyInstance;
	public apiServer: WebSocketApiServer;
	public messageServer: WebSocketMessageServer;
	public eventsServer: WebSocketEventsServer;
	public keyboardHandler: KeyboardHandlerManager;

	constructor(readonly config: DevServerOptions) {
		this.terminalReporter = new TeardownTerminalReporter(this);

		this.stream = new Writable({
			write: this.onWrite.bind(this),
		});

		this.instance = Fastify({
			// disableRequestLogging: true,
			logger: {
				level: "trace",
				stream: this.stream,
			},
			...(config.https ? { https: config.https } : undefined),
		});

		this.apiServer = new WebSocketApiServer(this.instance);
		this.messageServer = new WebSocketMessageServer(this.instance);
		this.eventsServer = new WebSocketEventsServer(this.instance, {
			webSocketMessageServer: this.messageServer,
		});

		this.keyboardHandler = new KeyboardHandlerManager(this);
	}

	async onWrite(
		chunk: any,
		encoding: BufferEncoding,
		callback: (error?: Error | null) => void,
	) {
		if (chunk == null) {
			return;
		}

		const log = JSON.parse(chunk.toString());
		this.onMessage(log);
		callback();
	}

	public getDevServerUrl() {
		const https = this.config.https ? "https" : "http";
		return `${https}://${this.config.host}:${this.config.port}`;
	}

	public onInitializeDone() {
		this.keyboardHandler.initialize();
	}

	public reportMetroEvent(event: TerminalReportableEvent) {
		switch (event.type) {
			case "client_log":
				this.eventsServer.broadcastEvent(event);
				break;
		}
	}

	private onBundleBuilt(bundlePath: string): void {
		// console.log("onBundleBuilt", bundlePath);
		this.messageServer.broadcast("reload");
	}

	private onMessage(log: Log): void {
		// this.apiServer.send(log);
		// console.log("onMessage", log);
		// this.terminalReporter.update({
		// 	type: "client_log",
		// 	level: "info",
		// 	data: [log.msg],
		// });
	}

	private onClientConnected(platform: string, clientId: string): void {
		// this.messageServer.broadcast("reload", undefined, []);
		// this.instance.wss.router.onClientConnected(platform, clientId);
		// this.onMessage({
		// 	level: 30,
		// 	time: Date.now(),
		// 	pid: 1,
		// 	hostname: "localhost",
		// });
	}

	private async loadMetroConfig(): Promise<ConfigT> {
		const config = await Metro.loadConfig({
			cwd: this.config.projectRoot,
			...this.config,
		});

		const reactNativeConfig = getDefaultConfig(this.config.projectRoot);

		return mergeConfig(reactNativeConfig, config);
	}

	private _metroConfig: ConfigT | null = null;

	private async getMetroConfig(): Promise<ConfigT> {
		if (!this._metroConfig) {
			this._metroConfig = await this.loadMetroConfig();
		}

		return mergeConfig(this._metroConfig, {
			reporter: this.terminalReporter,
		});
	}

	private async registerPlugins(): Promise<void> {
		const metroConfig = await this.getMetroConfig();
		const serverInstance = await Metro.createConnectMiddleware(metroConfig, {
			watch: true,
			onBundleBuilt: this.onBundleBuilt.bind(this),
		});

		// console.log("Registering plugins");
		const devMiddleware = createDevMiddleware({
			projectRoot: this.config.projectRoot,
			serverBaseUrl: `http://${this.config.host}:${this.config.port}`,
			logger: this.instance.log,
			unstable_customInspectorMessageHandler:
				this.customInspectorMessageHandler.bind(this),
			unstable_experiments: {
				// enableNewDebugger: this.config.experiments?.experimentalDebugger,
			},
		});
		await this.instance.register(cors, {
			// hook: "preHandler",
			// origin: ["localhost:1420", "127.0.0.1:1420"],
			// allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
			// credentials: true,
			// maxAge: 86400,
			// preflightContinue: false,
		});
		await this.instance.register(fastifyCompress);
		await this.instance.register(fastifySensible);
		await this.instance.register(fastifyMiddie);
		await this.instance.register(wssPlugin, {
			metroConfig,
			metroServer: serverInstance.metroServer,
			onClientConnected: this.onClientConnected.bind(this),
			messageServer: this.messageServer,
			eventsServer: this.eventsServer,
			apiServer: this.apiServer,
			endpoints: {
				"/inspector/debug":
					devMiddleware.websocketEndpoints["/inspector/debug"],
				"/inspector/device":
					devMiddleware.websocketEndpoints["/inspector/device"],
				"/inspector/network":
					devMiddleware.websocketEndpoints["/inspector/debug"],
			},
		});
		await this.instance.register(multipartPlugin);
		await this.instance.register(devtoolsPlugin, {
			host: this.config.host,
			port: this.config.port,
			https: this.config.https,
		});
		await this.instance.register(symbolicatePlugin, {
			onSymbolicate: this.onSymbolicate.bind(this),
		});
		await this.instance.register(systracePlugin);
		// await this.instance.register(faviconPlugin);

		// Register middleware
		this.instance.use("/open-url", openURLMiddleware);
		this.instance.use(
			"/open-stack-frame",
			openStackFrameInEditorMiddleware({
				watchFolders: [this.config.projectRoot],
			}),
		);

		this.instance.use(serverInstance.metroServer.processRequest);
		this.instance.use(devMiddleware.middleware);

		const DEFAULT_ALLOWED_CORS_HOSTNAMES = [
			"localhost",
			"chrome-devtools-frontend.appspot.com", // Support remote Chrome DevTools frontend
			"devtools", // Support local Chrome DevTools `devtools://devtools`
		];
		// this.instance.use((request, reply, done) => {
		// 	console.log("onRequest", request.url);
		// 	const origin = request.headers.origin;
		// 	if (origin && DEFAULT_ALLOWED_CORS_HOSTNAMES.includes(origin)) {
		// 		reply.setHeader("Access-Control-Allow-Origin", origin);
		// 	}

		// 	reply.setHeader("Access-Control-Allow-Origin", "*");

		// 	done();
		// });

		// this.instance.addHook("onSend", async (request, reply, payload) => {
		// 	console.log("onSend", request.url);
		// 	reply.header("X-Content-Type-Options", "nosniff");
		// 	reply.header("X-React-Native-Project-Root", this.config.projectRoot);

		// 	const [pathname] = request.url.split("?");
		// 	if (pathname.endsWith(".map")) {
		// 		reply.header("Access-Control-Allow-Origin", "*");
		// 	}

		// 	return payload;
		// });
		// console.log("Plugins registered");
	}

	private onSymbolicate(request: SymbolicateRequest, reply: SymbolicateReply) {
		console.log("onSymbolicate", request.rawBody);
	}

	private customInspectorMessageHandler(
		connection: CustomMessageHandlerConnection,
	): CustomMessageHandler {
		console.log("customInspectorMessageHandler", connection);
		return {
			handleDeviceMessage: (message: JSONSerializable) => {
				console.log("handleDeviceMessage", connection, message);
			},
			handleDebuggerMessage: (message: JSONSerializable) => {
				console.log("handleDebuggerMessage", connection, message);
			},
		};
	}

	private registerHooks(): void {
		// console.log("Registering hooks");
		this.instance = this.instance.addHook(
			"onSend",
			async (request, reply, payload) => {
				reply.header("X-Content-Type-Options", "nosniff");
				reply.header("X-React-Native-Project-Root", this.config.projectRoot);

				const [pathname] = request.url.split("?");
				if (pathname.endsWith(".map")) {
					reply.header("Access-Control-Allow-Origin", "devtools://devtools");
				}

				return payload;
			},
		);

		// console.log("Hooks registered");
	}

	private registerRoutes(): void {
		// console.log("Registering routes");
		this.instance.get("/", async () => "React Native packager is running");
		this.instance.get("/status", async () => "packager-status:running");
	}

	public async initialize(): Promise<void> {
		// console.log("Initializing dev server");
		await this.registerPlugins();
		this.registerHooks();
		this.registerRoutes();
	}

	public async start(): Promise<void> {
		this.instance.log.info("Starting dev server", this.config);
		await this.instance.listen({
			port: this.config.port,
			host: this.config.host,
		});
		this.instance.log.info(
			"Dev server started",
			this.instance.server.address(),
		);
	}

	public async stop(): Promise<void> {
		this.instance.log.info("Stopping dev server");
		await this.instance.close();
	}

	public getInstance(): FastifyInstance {
		return this.instance;
	}
}

const levelToTypeMapping: Record<number, LogType> = {
	10: "debug",
	20: "debug",
	30: "info",
	40: "warn",
	50: "error",
	60: "error",
};

type Log = {
	level: number;
	time: number;
	pid: number;
	hostname: string;
	msg: string;
} & Record<string, any>;

export interface Reporter {
	process(log: LogEntry): void;
	flush(): void;
	stop(): void;
}

/** Log message type. */
export type LogType =
	| "debug"
	| "info"
	| "warn"
	| "error"
	| "success"
	| "progress";

/**
 * Represent log message with all necessary data.
 *
 * @internal
 */
export interface LogEntry {
	timestamp: number;
	type: LogType;
	issuer: string;
	message: Array<string | number | boolean | Object>;
}

export function makeLogEntryFromFastifyLog(data: Log): LogEntry {
	const { level, time, pid, hostname, ...rest } = data;

	const levelToTypeMapping: Record<number, LogType> = {
		10: "debug",
		20: "debug",
		30: "info",
		40: "warn",
		50: "error",
		60: "error",
	};

	return {
		type: levelToTypeMapping[level] ?? "log",
		timestamp: time,
		issuer: "",
		message: [rest],
	};
}
