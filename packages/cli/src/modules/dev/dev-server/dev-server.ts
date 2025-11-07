import fastifyCompress from "@fastify/compress";
import cors from "@fastify/cors";
import fastifyMiddie from "@fastify/middie";
import fastifySensible from "@fastify/sensible";
import {
	openStackFrameInEditorMiddleware,
	openURLMiddleware,
} from "@react-native-community/cli-server-api";
import { getDefaultConfig, mergeConfig } from "@react-native/metro-config";
import Fastify, { type FastifyInstance } from "fastify";
import Metro from "metro";
import type { ConfigT } from "metro-config";
import type { TerminalReportableEvent } from "metro/src/lib/TerminalReporter";
import { Writable } from "node:stream";
import { KeyboardHandlerManager } from "../dev-menu/keyboard-handler";
import { TeardownTerminalReporter } from "../terminal/terminal.reporter";
import { Inspector } from "./inspector/inspector";
import { devtoolsPlugin } from "./plugins/devtools.plugin";
import { faviconPlugin } from "./plugins/favicon.plugin";
import { multipartPlugin } from "./plugins/multipart.plugin";
import { systracePlugin } from "./plugins/systrace.plugin";
import { wssPlugin } from "./plugins/wss";
import { WebSocketApiServer } from "./plugins/wss/servers/web-socket-api.server";
import { WebSocketEventsServer } from "./plugins/wss/servers/web-socket-events.server";
import { WebSocketMessageServer } from "./plugins/wss/servers/web-socket-message.server";
import {
	type SymbolicateReply,
	type SymbolicateRequest,
	symbolicatePlugin,
} from "./sybmolicate/sybmolicate.plugin";
import type { SymbolicatorResults } from "./sybmolicate/types";

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
	public inspector: Inspector;

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

		this.inspector = new Inspector({
			projectRoot: this.config.projectRoot,
			serverBaseUrl: this.getDevServerUrl(),
			eventReporter: this.terminalReporter,
		});
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
		// console.log("onWrite", log);
		this.apiServer.send(log);
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
		// console.log("reportMetroEvent", event);

		this.apiServer.send({
			type: "metro_event",
			event,
		});

		switch (event.type) {
			case "client_log":
				this.eventsServer.broadcastEvent(event);
				break;
		}
	}

	private onBundleBuilt(bundlePath: string): void {
		console.log("onBundleBuilt", bundlePath);
		// this.messageServer.broadcast("reload");
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

		const websockets = this.inspector.createWebSocketServers();

		// const devMiddleware = createDevMiddleware({
		// 	projectRoot: this.config.projectRoot,
		// 	serverBaseUrl: `http://${this.config.host}:${this.config.port}`,
		// 	logger: this.instance.log,
		// 	unstable_customInspectorMessageHandler:
		// 		this.customInspectorMessageHandler.bind(this),
		// 	unstable_experiments: {
		// 		enableNetworkInspector: true,
		// 	},
		// });

		// const debuggerConnectionServer = new DebuggerConnectionServer({
		// 	devices: this.devices,
		// 	eventReporter: this.eventReporter,
		// 	startHeartbeat: this.startHeartbeat,
		// });
		// const deviceConnectionServer = new DeviceConnectionServer(this.instance);

		await this.instance.register(cors, {
			origin: "*",
			// 	"localhost",
			// 	"localhost:8081",
			// 	"127.0.0.1",
			// 	"127.0.0.1:8081",
			// 	/localhost:\d+/,
			// 	/127\.0\.0\.1:\d+/,
			// ],
			// methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
			// allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
			// credentials: true,
			// maxAge: 86400,
			// preflight: true,
			preflightContinue: true,
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
				"/inspector/debug": websockets["/inspector/debug"],
				"/inspector/device": websockets["/inspector/device"],
				"/inspector/network": websockets["/inspector/debug"],
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
		await this.instance.register(faviconPlugin);

		// Register middleware
		this.instance.use("/open-url", openURLMiddleware);
		this.instance.use(
			"/open-stack-frame",
			openStackFrameInEditorMiddleware({
				watchFolders: [this.config.projectRoot],
			}),
		);

		this.instance.use(serverInstance.metroServer.processRequest);
		this.instance.use((req, resp, next) =>
			this.inspector.handleHttpRequest(req, resp, next),
		);
	}

	private onSymbolicate(request: SymbolicateRequest, reply: SymbolicateReply) {
		const result = JSON.parse(request.rawBody) as SymbolicatorResults;
		const { codeFrame, stack } = result;

		this.instance.log.info("onSymbolicate", { codeFrame, stack });
	}

	private registerHooks(): void {
		this.instance.log.info("Registering hooks");

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

		this.instance.log.info("Hooks registered");
	}

	private registerRoutes(): void {
		this.instance.log.info("Registering routes");
		this.instance.get("/", async () => "React Native packager is running");
		this.instance.get("/status", async () => "packager-status:running");
		this.instance.log.info("Routes registered");
	}

	public async initialize(): Promise<void> {
		this.instance.log.info("Initializing dev server");
		await this.registerPlugins();
		this.registerHooks();
		this.registerRoutes();
		this.instance.log.info("Dev server initialized");
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
		this.instance.log.info("Dev server stopped");
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
