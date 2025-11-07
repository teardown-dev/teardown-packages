import middie, { type NextHandleFunction } from "@fastify/middie";
import fastifySensible from "@fastify/sensible";
import fastifyCompress from "@fastify/compress";
import {
	openStackFrameInEditorMiddleware,
	openURLMiddleware,
} from "@react-native-community/cli-server-api";
import { createDevMiddleware } from "@react-native/dev-middleware";
import { getDefaultConfig, mergeConfig } from "@react-native/metro-config";
import Fastify, { type FastifyInstance } from "fastify";
import Metro from "metro";
import type { ConfigT } from "metro-config";
import type { TerminalReportableEvent } from "metro/src/lib/TerminalReporter";
import { Writable } from "node:stream";
import { TeardownTerminalReporter } from "../terminal/terminal.reporter";
import { devtoolsPlugin } from "./plugins/devtools.plugin";
// import { faviconPlugin } from "./plugins/favicon.plugin";
import { multipartPlugin } from "./plugins/multipart.plugin";
import { symbolicatePlugin } from "./plugins/symbolicate";
import { wssPlugin } from "./plugins/wss";
import { WebSocketEventsServer } from "./plugins/wss/servers/web-socket-events.server";
import { WebSocketMessageServer } from "./plugins/wss/servers/web-socket-message.server";
import { KeyboardHandlerManager } from "../dev-menu/keyboard-handler";

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

	private instance: FastifyInstance;
	public messageServer: WebSocketMessageServer;
	public eventsServer: WebSocketEventsServer;
	public keyboardHandler: KeyboardHandlerManager;

	constructor(readonly config: DevServerOptions) {
		this.terminalReporter = new TeardownTerminalReporter(this);
		this.instance = Fastify({
			// disableRequestLogging: false,
			logger: {
				level: "trace",
				stream: new Writable({
					write: (chunk: any, _encoding: any, callback: any) => {
						const log = JSON.parse(chunk.toString());
						this.onMessage(log);
						this.instance.wss?.apiServer.send(log);
						callback();
					},
				}),
			},
			...(config.https ? { https: config.https } : undefined),
		});

		this.messageServer = new WebSocketMessageServer(this.instance);
		this.eventsServer = new WebSocketEventsServer(this.instance, {
			webSocketMessageServer: this.messageServer,
		});

		this.keyboardHandler = new KeyboardHandlerManager(this);
	}

	public getDevServerUrl() {
		const https = this.config.https ? "https" : "http";
		return `${https}://${this.config.host}:${this.config.port}`;
	}

	public onInitializeDone() {
		this.keyboardHandler.initialize();
	}

	public reportMetroEvent(event: TerminalReportableEvent) {
		// this.messageServer.broadcast("report_event", event);
		// console.log("Metro event", event);
	}

	private onBundleBuilt(bundlePath: string): void {
		console.log("onBundleBuilt", bundlePath);
	}

	private onMessage(log: Log): void {
		this.terminalReporter.update({
			type: "client_log",
			level: "info",
			data: [log.msg],
		});
	}

	private onClientConnected(platform: string, clientId: string): void {
		console.log("onClientConnected", platform, clientId);
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
			unstable_experiments: {
				// enableNewDebugger: this.config.experiments?.experimentalDebugger,
			},
		});

		await this.instance.register(fastifyCompress);
		await this.instance.register(fastifySensible);
		await this.instance.register(middie);
		await this.instance.register(wssPlugin, {
			metroConfig,
			metroServer: serverInstance.metroServer,
			onClientConnected: this.onClientConnected.bind(this),
			messageServer: this.messageServer,
			eventsServer: this.eventsServer,
			endpoints: {
				"/inspector/debug":
					devMiddleware.websocketEndpoints["/inspector/debug"],
				"/inspector/device":
					devMiddleware.websocketEndpoints["/inspector/device"],
				"/inspector/network":
					devMiddleware.websocketEndpoints["/inspector/debug"], // Uses same endpoint as debugger to handle Network-related CDP events
			},
		});
		await this.instance.register(multipartPlugin);
		await this.instance.register(devtoolsPlugin, {
			host: this.config.host,
			port: this.config.port,
			https: this.config.https,
		});
		await this.instance.register(symbolicatePlugin);
		// await this.instance.register(faviconPlugin);

		// Register middleware
		this.instance.use("/open-url", openURLMiddleware);
		this.instance.use(
			"/open-stack-frame",
			openStackFrameInEditorMiddleware({
				watchFolders: [this.config.projectRoot],
			}),
		);
		this.instance.use(devMiddleware.middleware);

		// Convert Metro middleware to Fastify middleware format
		this.instance.use((req, res, next) => {
			const middleware = serverInstance.middleware as NextHandleFunction;
			middleware(req, res, next);
		});
		// console.log("Plugins registered");
	}

	private registerHooks(): void {
		// console.log("Registering hooks");
		this.instance.addHook(
			"onSend",
			async (request: any, reply: any, payload: any) => {
				reply.header("X-Content-Type-Options", "nosniff");
				reply.header("X-React-Native-Project-Root", this.config.projectRoot);

				const [pathname] = request.url.split("?");
				if (pathname.endsWith(".map")) {
					reply.header("Access-Control-Allow-Origin", "devtools://devtools");
				}

				return payload;
			},
		);
	}

	private registerRoutes(): void {
		// console.log("Registering routes");
		this.instance.get("/", async () => "React Native packager is running");
		this.instance.get("/status", async () => "packager-status:running");
	}

	public async initialize(): Promise<void> {
		console.log("Initializing dev server");
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
		console.log("Dev server started", this.instance.server.address());
	}

	public async stop(): Promise<void> {
		console.log("Stopping dev server");
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
