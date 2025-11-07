import { WebSocket, WebSocketServer } from "ws";
import type { IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";
import url from "node:url";
import { Device } from "./device";
import type { DeviceEventReporter } from "./device.event-reporter";
import type { EventReporter, Page, PageDescription } from "./types";
import type { CDPAdapter } from "../cdp/cdp.adapter";

const WS_DEVICE_PATH = "/inspector/device";
const WS_DEBUGGER_PATH = "/inspector/debug";
const JSON_VERSION_PATH = "/json/version";
const JSON_LIST_PATH = "/json";
const JSON_LIST_PATH_2 = "/json/list";

const HEARTBEAT_INTERVAL = 10000;
const MAX_PONG_TIMEOUT = 15000;
const INTERNAL_ERROR_CODE = 1011;

export interface InspectorOptions {
	projectRoot: string;
	serverBaseUrl: string;
	eventReporter?: EventReporter;
	cdpAdapter?: CDPAdapter;
}

export class Inspector {
	private devices: Map<string, Device> = new Map();
	private deviceCounter = 0;
	private readonly projectRoot: string;
	private readonly serverBaseUrl: string;
	private readonly eventReporter?: EventReporter;
	private readonly cdpAdapter?: CDPAdapter;

	constructor(options: InspectorOptions) {
		this.projectRoot = options.projectRoot;
		this.serverBaseUrl = options.serverBaseUrl;
		this.eventReporter = options.eventReporter;
		this.cdpAdapter = options.cdpAdapter;
	}

	public getPageDescriptions(): PageDescription[] {
		const descriptions: PageDescription[] = [];
		for (const [deviceId, device] of this.devices.entries()) {
			const devicePages = device
				.getPagesList()
				.map((page) => this.createPageDescription(deviceId, device, page));
			descriptions.push(...devicePages);
		}
		return descriptions;
	}

	public handleHttpRequest(
		req: IncomingMessage,
		res: ServerResponse,
		next: (error?: Error) => void,
	) {
		const pathname = new URL(req.url || "", "http://localhost").pathname;
		if (pathname === JSON_LIST_PATH || pathname === JSON_LIST_PATH_2) {
			this.sendJsonResponse(res, this.getPageDescriptions());
		} else if (pathname === JSON_VERSION_PATH) {
			this.sendJsonResponse(res, {
				Browser: "Mobile JavaScript",
				"Protocol-Version": "1.1",
			});
		} else {
			next();
		}
	}

	public createWebSocketServers(): Record<string, WebSocketServer> {
		return {
			[WS_DEVICE_PATH]: this.createDeviceWebSocketServer(),
			[WS_DEBUGGER_PATH]: this.createDebuggerWebSocketServer(),
		};
	}

	private createPageDescription(
		deviceId: string,
		device: Device,
		page: Page,
	): PageDescription {
		const { host, protocol } = new URL(this.serverBaseUrl);
		const wsProtocol = protocol === "https:" ? "wss" : "ws";
		const wsPath = `${host}${WS_DEBUGGER_PATH}?device=${deviceId}&page=${page.id}`;

		return {
			id: `${deviceId}-${page.id}`,
			title: page.title,
			// @ts-ignore
			description: page.description || page.app,
			type: "node",
			webSocketDebuggerUrl: `${wsProtocol}://${wsPath}`,
			devtoolsFrontendUrl: `devtools://devtools/bundled/js_app.html?experiments=true&v8only=true&${wsProtocol}=${encodeURIComponent(wsPath)}`,
			deviceName: device.getName(),
			appId: page.app,
			vm: page.vm,
			reactNative: {
				logicalDeviceId: deviceId,
				capabilities: page.capabilities,
			},
		};
	}

	private createDeviceWebSocketServer(): WebSocketServer {
		const wss = new WebSocketServer({
			noServer: true,
			perMessageDeflate: true,
			maxPayload: 0,
		});

		wss.on("connection", (socket: WebSocket, req: IncomingMessage) => {
			try {
				const fallbackDeviceId = String(this.deviceCounter++);

				const query = url.parse(req.url || "", true).query || {};
				const deviceId = query.device || fallbackDeviceId;
				const deviceName = query.name || "Unknown";
				const appName = query.app || "Unknown";

				const actualDeviceId = Array.isArray(deviceId) ? deviceId[0] : deviceId;
				const actualDeviceName = Array.isArray(deviceName)
					? deviceName[0]
					: deviceName;
				const actualAppName = Array.isArray(appName) ? appName[0] : appName;

				const oldDevice = this.devices.get(actualDeviceId);
				let newDevice: Device;
				if (oldDevice) {
					oldDevice.dangerouslyRecreateDevice(
						actualDeviceId,
						actualDeviceName,
						actualAppName,
						socket,
						this.projectRoot,
						this.eventReporter,
					);
					newDevice = oldDevice;
				} else {
					newDevice = new Device(
						actualDeviceId,
						actualDeviceName,
						actualAppName,
						socket,
						this.projectRoot,
						this.eventReporter,
					);
				}

				this.devices.set(actualDeviceId, newDevice);

				socket.on("close", () => {
					if (
						this.devices.get(actualDeviceId)?.dangerouslyGetSocket() === socket
					) {
						this.devices.delete(actualDeviceId);
					}
					// debug(`Device ${deviceName} disconnected.`);
				});
			} catch (e) {
				console.error("error", e);
				socket.close(INTERNAL_ERROR_CODE, e?.toString() ?? "Unknown error");
			}
		});

		return wss;
	}

	private createDebuggerWebSocketServer(): WebSocketServer {
		const wss = new WebSocketServer({
			noServer: true,
			maxPayload: 0,
		});

		wss.on("open", () => {
			console.info("open");
		});

		wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
			try {
				const query = new URL(req.url || "", "http://localhost").searchParams;
				const deviceId = query.get("device");
				const pageId = query.get("page");

				if (!deviceId || !pageId) {
					console.info("missing device or page id", deviceId, pageId);
					return;
				}

				const device = this.devices.get(deviceId);
				if (!device) {
					console.info("device not found", deviceId);
					return;
				}

				this.setupHeartbeat(ws);

				device.handleDebuggerConnection(ws, pageId, {
					userAgent: req.headers["user-agent"] || null,
				});
			} catch (err) {
				console.error(err);
				ws.close(
					INTERNAL_ERROR_CODE,
					err instanceof Error ? err.message : "Unknown error",
				);
				this.eventReporter?.logEvent({
					type: "connect_debugger_frontend",
					status: "error",
					error: err,
				});
			}
		});

		return wss;
	}

	private setupHeartbeat(ws: WebSocket): void {
		let pendingHeartbeat = false;
		let terminateTimeout: ReturnType<typeof setTimeout> | null = null;

		const heartbeat = setInterval(() => {
			if (ws.readyState !== WebSocket.OPEN) {
				return;
			}

			pendingHeartbeat = true;
			// Send a heartbeat message instead of ping
			ws.send(JSON.stringify({ method: "_heartbeat" }));

			terminateTimeout = setTimeout(() => {
				if (ws.readyState === WebSocket.OPEN) {
					try {
						ws.terminate();
					} catch (e) {
						ws.close(INTERNAL_ERROR_CODE, "Termination failed");
					}
				}
			}, MAX_PONG_TIMEOUT);
		}, HEARTBEAT_INTERVAL);

		const resetHeartbeat = () => {
			pendingHeartbeat = false;
			if (terminateTimeout) {
				clearTimeout(terminateTimeout);
				terminateTimeout = null;
			}
		};

		ws.on("message", (data) => {
			try {
				const message = JSON.parse(data.toString());
				// Check for heartbeat response
				if (message.method === "_heartbeat_response") {
					resetHeartbeat();
					return;
				}
			} catch (e) {
				// If message isn't JSON or doesn't have expected format,
				// treat it as regular message for heartbeat purposes
				resetHeartbeat();
			}
		});

		ws.on("close", () => {
			clearInterval(heartbeat);
			resetHeartbeat();
		});
	}

	private sendJsonResponse(res: ServerResponse, data: unknown) {
		const json = JSON.stringify(data, null, 2);
		res.writeHead(200, {
			"Content-Type": "application/json; charset=UTF-8",
			"Cache-Control": "no-cache",
			"Content-Length": Buffer.byteLength(json),
			Connection: "close",
		});
		res.end(json);
	}
}
