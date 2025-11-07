import TTLCache from "@isaacs/ttlcache";
import { EventReporter } from "./types";

export type RequestMetadata = {
	pageId: string | null;
	frontendUserAgent: string | null;
	prefersFuseboxFrontend: boolean | null;
};

export type ResponseMetadata = RequestMetadata;

export type DeviceMetadata = {
	appId: string;
	deviceId: string;
	deviceName: string;
};

type PendingCommand = {
	method: string;
	requestOrigin: "proxy" | "debugger";
	requestTime: number;
	metadata: RequestMetadata;
};

export class DeviceEventReporter {
	private eventReporter: EventReporter;
	private metadata: DeviceMetadata;
	private pendingCommands: TTLCache<number, PendingCommand>;

	constructor(eventReporter: EventReporter, metadata: DeviceMetadata) {
		this.eventReporter = eventReporter;
		this.metadata = metadata;
		this.pendingCommands = new TTLCache({
			ttl: 10000,
			dispose: (
				command: PendingCommand,
				id: number,
				reason: "evict" | "set" | "delete" | "stale",
			) => {
				if (reason === "delete" || reason === "set") {
					// TODO: Report clobbering ('set') using a dedicated error code
					return;
				}
				this.logExpiredCommand(command);
			},
		});
	}

	logRequest(
		req: { id: number; method: string; [key: string]: unknown },
		origin: "debugger" | "proxy",
		metadata: RequestMetadata,
	): void {
		this.pendingCommands.set(req.id, {
			method: req.method,
			requestOrigin: origin,
			requestTime: Date.now(),
			metadata,
		});
	}

	logResponse(
		res: { id: number; error?: { message: string; data?: unknown } },
		origin: "device" | "proxy",
		metadata: ResponseMetadata,
	): void {
		const pendingCommand = this.pendingCommands.get(res.id);
		if (!pendingCommand) {
			this.eventReporter.logEvent({
				type: "debugger_command",
				protocol: "CDP",
				requestOrigin: null,
				method: null,
				status: "coded_error",
				errorCode: "UNMATCHED_REQUEST_ID",
				responseOrigin: origin,
				timeSinceStart: null,
				appId: this.metadata.appId,
				deviceId: this.metadata.deviceId,
				deviceName: this.metadata.deviceName,
				pageId: metadata.pageId,
				frontendUserAgent: metadata.frontendUserAgent,
				prefersFuseboxFrontend: metadata.prefersFuseboxFrontend,
			});
			return;
		}

		const timeSinceStart = Date.now() - pendingCommand.requestTime;
		this.pendingCommands.delete(res.id);

		if (res.error) {
			let message = res.error.message;
			if ("data" in res.error) {
				message += ` (${String(res.error.data)})`;
			}
			this.eventReporter.logEvent({
				type: "debugger_command",
				requestOrigin: pendingCommand.requestOrigin,
				method: pendingCommand.method,
				protocol: "CDP",
				status: "coded_error",
				errorCode: "PROTOCOL_ERROR",
				errorDetails: message,
				responseOrigin: origin,
				timeSinceStart,
				appId: this.metadata.appId,
				deviceId: this.metadata.deviceId,
				deviceName: this.metadata.deviceName,
				pageId: pendingCommand.metadata.pageId,
				frontendUserAgent: pendingCommand.metadata.frontendUserAgent,
				prefersFuseboxFrontend: metadata.prefersFuseboxFrontend,
			});
			return;
		}

		this.eventReporter.logEvent({
			type: "debugger_command",
			protocol: "CDP",
			requestOrigin: pendingCommand.requestOrigin,
			method: pendingCommand.method,
			status: "success",
			responseOrigin: origin,
			timeSinceStart,
			appId: this.metadata.appId,
			deviceId: this.metadata.deviceId,
			deviceName: this.metadata.deviceName,
			pageId: pendingCommand.metadata.pageId,
			frontendUserAgent: pendingCommand.metadata.frontendUserAgent,
			prefersFuseboxFrontend: metadata.prefersFuseboxFrontend,
		});
	}

	logConnection(
		connectedEntity: "debugger",
		metadata: {
			pageId: string;
			frontendUserAgent: string | null;
		},
	): void {
		this.eventReporter.logEvent({
			type: "connect_debugger_frontend",
			status: "success",
			appId: this.metadata.appId,
			deviceName: this.metadata.deviceName,
			deviceId: this.metadata.deviceId,
			pageId: metadata.pageId,
			frontendUserAgent: metadata.frontendUserAgent,
		});
	}

	logDisconnection(disconnectedEntity: "device" | "debugger"): void {
		const errorCode =
			disconnectedEntity === "device"
				? "DEVICE_DISCONNECTED"
				: "DEBUGGER_DISCONNECTED";

		for (const pendingCommand of this.pendingCommands.values()) {
			this.eventReporter.logEvent({
				type: "debugger_command",
				protocol: "CDP",
				requestOrigin: pendingCommand.requestOrigin,
				method: pendingCommand.method,
				status: "coded_error",
				errorCode,
				responseOrigin: "proxy",
				timeSinceStart: Date.now() - pendingCommand.requestTime,
				appId: this.metadata.appId,
				deviceId: this.metadata.deviceId,
				deviceName: this.metadata.deviceName,
				pageId: pendingCommand.metadata.pageId,
				frontendUserAgent: pendingCommand.metadata.frontendUserAgent,
				prefersFuseboxFrontend: pendingCommand.metadata.prefersFuseboxFrontend,
			});
		}
		this.pendingCommands.clear();
	}

	logProxyMessageHandlingError(
		messageOrigin: "device" | "debugger",
		error: Error,
		message: string,
	): void {
		this.eventReporter.logEvent({
			type: "proxy_error",
			status: "error",
			messageOrigin,
			message,
			error: error.message,
			errorStack: error.stack ?? "",
			appId: this.metadata.appId,
			deviceId: this.metadata.deviceId,
			deviceName: this.metadata.deviceName,
			pageId: null,
		});
	}

	private logExpiredCommand(pendingCommand: PendingCommand): void {
		this.eventReporter.logEvent({
			type: "debugger_command",
			protocol: "CDP",
			requestOrigin: pendingCommand.requestOrigin,
			method: pendingCommand.method,
			status: "coded_error",
			errorCode: "TIMED_OUT",
			responseOrigin: "proxy",
			timeSinceStart: Date.now() - pendingCommand.requestTime,
			appId: this.metadata.appId,
			deviceId: this.metadata.deviceId,
			deviceName: this.metadata.deviceName,
			pageId: pendingCommand.metadata.pageId,
			frontendUserAgent: pendingCommand.metadata.frontendUserAgent,
			prefersFuseboxFrontend: pendingCommand.metadata.prefersFuseboxFrontend,
		});
	}
}
