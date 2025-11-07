import WS from "ws";
import url from "node:url";
import { Device } from "../../device";
import type { EventReporter, CreateCustomMessageHandlerFn } from "../../types";

const debug = require("debug")("Metro:InspectorProxy");

const INTERNAL_ERROR_CODE = 1011;

interface DeviceCounter {
	value: number;
}

interface DeviceConnectionServerConfig {
	devices: Map<string, Device>;
	deviceCounter: DeviceCounter;
	projectRoot: string;
	eventReporter: EventReporter | null;
	customMessageHandler: CreateCustomMessageHandlerFn | null;
}

export default class DeviceConnectionServer {
	#devices: Map<string, Device>;
	#deviceCounter: DeviceCounter;
	#projectRoot: string;
	#eventReporter: EventReporter | null;
	#customMessageHandler: CreateCustomMessageHandlerFn | null;

	constructor({
		devices,
		deviceCounter,
		projectRoot,
		eventReporter,
		customMessageHandler,
	}: DeviceConnectionServerConfig) {
		this.#devices = devices;
		this.#deviceCounter = deviceCounter;
		this.#projectRoot = projectRoot;
		this.#eventReporter = eventReporter;
		this.#customMessageHandler = customMessageHandler;
	}

	createServer(): WS.Server {
		const wss = new WS.Server({
			noServer: true,
			perMessageDeflate: true,
			maxPayload: 0,
		});

		wss.on("connection", async (socket, req) => {
			try {
				const fallbackDeviceId = String(this.#deviceCounter.value++);

				const query = url.parse(req.url || "", true).query || {};
				const deviceId = (query.device as string) || fallbackDeviceId;
				const deviceName = (query.name as string) || "Unknown";
				const appName = (query.app as string) || "Unknown";

				const oldDevice = this.#devices.get(deviceId);
				let newDevice: Device;

				if (oldDevice) {
					oldDevice.dangerouslyRecreateDevice(
						deviceId,
						deviceName,
						appName,
						socket,
						this.#projectRoot,
						this.#eventReporter,
					);
					newDevice = oldDevice;
				} else {
					newDevice = new Device(
						deviceId,
						deviceName,
						appName,
						socket,
						this.#projectRoot,
						this.#eventReporter,
					);
				}

				this.#devices.set(deviceId, newDevice);

				debug(
					`Got new connection: name=${deviceName}, app=${appName}, device=${deviceId}`,
				);

				socket.on("close", () => {
					const device = this.#devices.get(deviceId);
					if (device?.dangerouslyGetSocket() === socket) {
						this.#devices.delete(deviceId);
					}
					debug(`Device ${deviceName} disconnected.`);
				});
			} catch (e) {
				console.error("error", e);
				socket.close(INTERNAL_ERROR_CODE, e?.toString() ?? "Unknown error");
			}
		});

		return wss;
	}
}
