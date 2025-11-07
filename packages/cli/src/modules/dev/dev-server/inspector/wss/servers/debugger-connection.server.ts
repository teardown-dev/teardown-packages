import url from "node:url";
import WS from "ws";
import type { EventReporter } from "../../types";

import type { Device } from "../../device";
const debug = require("debug")("Metro:InspectorProxy");

const INTERNAL_ERROR_CODE = 1011;
const DEBUGGER_HEARTBEAT_INTERVAL_MS = 10000;
const MAX_PONG_LATENCY_MS = 5000;

interface DebuggerConnectionServerConfig {
	devices: Map<string, Device>;
	eventReporter: EventReporter | null;
	startHeartbeat: (socket: WS, intervalMs: number) => void;
}

export default class DebuggerConnectionServer {
	#devices: Map<string, Device>;
	#eventReporter: EventReporter | null;
	#startHeartbeat: (socket: WS, intervalMs: number) => void;

	constructor({
		devices,
		eventReporter,
		startHeartbeat,
	}: DebuggerConnectionServerConfig) {
		this.#devices = devices;
		this.#eventReporter = eventReporter;
		this.#startHeartbeat = startHeartbeat;
	}

	createServer(): WS.Server {
		const wss = new WS.Server({
			noServer: true,
			perMessageDeflate: false,
			// Don't crash on exceptionally large messages - assume the debugger is
			// well-behaved and the device is prepared to handle large messages.
			maxPayload: 0,
		});

		wss.on("connection", async (socket, req) => {
			try {
				const query = url.parse(req.url || "", true).query || {};
				const deviceId = query.device as string | undefined;
				const pageId = query.page as string | undefined;

				if (deviceId == null || pageId == null) {
					throw new Error("Incorrect URL - must provide device and page IDs");
				}

				const device = this.#devices.get(deviceId);
				if (device == null) {
					throw new Error(`Unknown device with ID ${deviceId}`);
				}

				this.#startHeartbeat(socket, DEBUGGER_HEARTBEAT_INTERVAL_MS);

				device.handleDebuggerConnection(socket, pageId, {
					userAgent: Array.isArray(req.headers["user-agent"])
						? req.headers["user-agent"][0]
						: req.headers["user-agent"] || query.userAgent || null,
				});
			} catch (e) {
				console.error(e);
				socket.close(INTERNAL_ERROR_CODE, e?.toString() ?? "Unknown error");
				this.#eventReporter?.logEvent({
					type: "connect_debugger_frontend",
					status: "error",
					error: e,
				});
			}
		});

		return wss;
	}
}
