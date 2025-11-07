import fs from "node:fs";
import path from "node:path";
import { URL } from "node:url";
import WS from "ws";
import type { CDPClientMessage, CDPRequest, CDPServerMessage } from "../cdp";
import { DeviceEventReporter } from "./device.event-reporter";
import type {
	CreateCustomMessageHandlerFn,
	DebuggerConnection,
	EventReporter,
	MessageFromDevice,
	MessageToDevice,
	Page,
	PageFromDevice,
} from "./types";

const debug = require("debug")("Metro:InspectorProxy");

const PAGES_POLLING_INTERVAL = 1000;

// Constants for host rewriting
const REWRITE_HOSTS_TO_LOCALHOST: string[] = [
	"127.0.0.1",
	"10.0.2.2",
	"10.0.3.2",
];

const FILE_PREFIX = "file://";
const REACT_NATIVE_RELOADABLE_PAGE_ID = "-1";

export class Device {
	private id: string;
	private name: string;
	private app: string;
	private messageFromDeviceQueue: Promise<void> = Promise.resolve();
	private deviceSocket: WS;
	private pages: Map<string, Page> = new Map();
	private debuggerConnection: DebuggerConnection | null = null;
	private lastConnectedLegacyReactNativePage: Page | null = null;
	private isLegacyPageReloading = false;
	private lastGetPagesMessage = "";
	private scriptIdToSourcePathMapping: Map<string, string> = new Map();
	private projectRoot: string;
	private deviceEventReporter: DeviceEventReporter | null;
	private pagesPollingIntervalId: ReturnType<typeof setInterval>;
	private createCustomMessageHandler: CreateCustomMessageHandlerFn | null;
	private connectedPageIds: Set<string> = new Set();

	constructor(
		id: string,
		name: string,
		app: string,
		socket: WS,
		projectRoot: string,
		eventReporter?: EventReporter,
	) {
		this.id = id;
		this.name = name;
		this.app = app;
		this.deviceSocket = socket;
		this.projectRoot = projectRoot;
		this.deviceEventReporter =
			eventReporter != null
				? new DeviceEventReporter(eventReporter, {
						deviceId: id,
						deviceName: name,
						appId: app,
					})
				: null;
		this.createCustomMessageHandler = null;

		// Setup message handling
		this.deviceSocket.on("message", (message: string) => {
			this.messageFromDeviceQueue = this.messageFromDeviceQueue
				.then(async () => {
					const parsedMessage = JSON.parse(message);
					if (parsedMessage.event === "getPages") {
						if (message !== this.lastGetPagesMessage) {
							debug(
								`(Debugger)    (Proxy) <- (Device), getPages ping has changed: ${message}`,
							);
							this.lastGetPagesMessage = message;
						}
					} else {
						debug(`(Debugger)    (Proxy) <- (Device): ${message}`);
					}
					await this.handleMessageFromDevice(parsedMessage);
				})
				.catch((error) => {
					debug("%O\nHandling device message: %s", error, message);
					try {
						this.deviceEventReporter?.logProxyMessageHandlingError(
							"device",
							error,
							message,
						);
					} catch (loggingError) {
						debug(
							"Error logging message handling error to reporter: %O",
							loggingError,
						);
					}
				});
		});

		// Setup polling
		this.pagesPollingIntervalId = setInterval(
			() => this.sendMessageToDevice({ event: "getPages" }),
			PAGES_POLLING_INTERVAL,
		);

		// Handle socket close
		this.deviceSocket.on("close", () => {
			if (socket === this.deviceSocket) {
				this.deviceEventReporter?.logDisconnection("device");
				this.terminateDebuggerConnection();
				clearInterval(this.pagesPollingIntervalId);
			}
		});
	}

	private terminateDebuggerConnection(): void {
		const debuggerConnection = this.debuggerConnection;
		if (debuggerConnection) {
			this.sendDisconnectEventToDevice(
				this.mapToDevicePageId(debuggerConnection.pageId),
			);
			debuggerConnection.socket.close();
			this.debuggerConnection = null;
		}
	}

	dangerouslyRecreateDevice(
		id: string,
		name: string,
		app: string,
		socket: WS,
		projectRoot: string,
		eventReporter?: EventReporter,
	): void {
		invariant(
			id === this.id,
			"dangerouslyRecreateDevice() can only be used for the same device ID",
		);

		const oldDebugger = this.debuggerConnection;

		if (this.app !== app || this.name !== name) {
			this.deviceSocket.close();
			this.terminateDebuggerConnection();
		}

		this.debuggerConnection = null;

		if (oldDebugger) {
			oldDebugger.socket.removeAllListeners();
			this.deviceSocket.close();
			this.handleDebuggerConnection(oldDebugger.socket, oldDebugger.pageId, {
				userAgent: oldDebugger.userAgent,
			});
		}

		this.id = id;
		this.name = name;
		this.app = app;
		this.deviceSocket = socket;
		this.projectRoot = projectRoot;
		this.deviceEventReporter = eventReporter
			? new DeviceEventReporter(eventReporter, {
					deviceId: id,
					deviceName: name,
					appId: app,
				})
			: null;
	}

	getName(): string {
		return this.name;
	}

	getApp(): string {
		return this.app;
	}

	getPagesList(): Page[] {
		if (this.lastConnectedLegacyReactNativePage) {
			return [...this.pages.values(), this.createSyntheticPage()];
		}
		return [...this.pages.values()];
	}

	handleDebuggerConnection(
		socket: WS,
		pageId: string,
		metadata: {
			userAgent: string | null;
		},
	): void {
		const page: Page | undefined =
			pageId === REACT_NATIVE_RELOADABLE_PAGE_ID
				? this.createSyntheticPage()
				: this.pages.get(pageId);

		if (!page) {
			debug(
				`Got new debugger connection for page ${pageId} of ${this.name}, but no such page exists`,
			);
			socket.close();
			return;
		}

		this.deviceEventReporter?.logDisconnection("debugger");
		this.terminateDebuggerConnection();

		this.deviceEventReporter?.logConnection("debugger", {
			pageId,
			frontendUserAgent: metadata.userAgent,
		});

		const debuggerInfo: DebuggerConnection = {
			socket,
			prependedFilePrefix: false,
			pageId,
			userAgent: metadata.userAgent,
			customHandler: null,
		};

		this.debuggerConnection = debuggerInfo;

		if (this.debuggerConnection && this.createCustomMessageHandler) {
			this.debuggerConnection.customHandler = this.createCustomMessageHandler({
				page,
				debugger: {
					userAgent: debuggerInfo.userAgent,
					sendMessage: (message) => {
						try {
							const payload = JSON.stringify(message);
							debug(`(Debugger) <- (Proxy)    (Device): ${payload}`);
							socket.send(payload);
						} catch {}
					},
				},
				device: {
					appId: this.app,
					id: this.id,
					name: this.name,
					sendMessage: (message) => {
						try {
							const payload = JSON.stringify({
								event: "wrappedEvent",
								payload: {
									pageId: this.mapToDevicePageId(pageId),
									wrappedEvent: JSON.stringify(message),
								},
							});
							debug(`(Debugger) -> (Proxy)    (Device): ${payload}`);
							this.deviceSocket.send(payload);
						} catch {}
					},
				},
			});
		}

		this.sendConnectEventToDevice(this.mapToDevicePageId(pageId));

		socket.on("message", (message: string) => {
			debug(`(Debugger) -> (Proxy)    (Device): ${message}`);
			const debuggerRequest = JSON.parse(message);
			this.deviceEventReporter?.logRequest(debuggerRequest, "debugger", {
				pageId: this.debuggerConnection?.pageId ?? null,
				frontendUserAgent: metadata.userAgent,
				prefersFuseboxFrontend: this.isPageFuseboxFrontend(
					this.debuggerConnection?.pageId ?? null,
				),
			});

			if (
				this.debuggerConnection?.customHandler?.handleDebuggerMessage(
					debuggerRequest,
				) === true
			) {
				return;
			}

			if (!this.pageHasCapability(page, "nativeSourceCodeFetching")) {
				const processedReq = this.interceptClientMessageForSourceFetching(
					debuggerRequest,
					debuggerInfo,
					socket,
				);
				if (processedReq) {
					this.sendMessageToDevice({
						event: "wrappedEvent",
						payload: {
							pageId: this.mapToDevicePageId(pageId),
							wrappedEvent: JSON.stringify(processedReq),
						},
					});
				}
			}
		});

		socket.on("close", () => {
			debug(`Debugger for page ${pageId} and ${this.name} disconnected.`);
			this.deviceEventReporter?.logDisconnection("debugger");
			if (this.debuggerConnection?.socket === socket) {
				this.terminateDebuggerConnection();
			}
		});

		const sendFunc = socket.send.bind(socket);
		socket.send = (message: string) => {
			debug(`(Debugger) <- (Proxy)    (Device): ${message}`);
			return sendFunc(message);
		};
	}

	private sendConnectEventToDevice(devicePageId: string): void {
		if (this.connectedPageIds.has(devicePageId)) {
			return;
		}
		this.connectedPageIds.add(devicePageId);
		this.sendMessageToDevice({
			event: "connect",
			payload: { pageId: devicePageId },
		});
	}

	private sendDisconnectEventToDevice(devicePageId: string): void {
		if (!this.connectedPageIds.has(devicePageId)) {
			return;
		}
		this.connectedPageIds.delete(devicePageId);
		this.sendMessageToDevice({
			event: "disconnect",
			payload: { pageId: devicePageId },
		});
	}

	private pageHasCapability(page: Page, flag: string): boolean {
		return page.capabilities[flag] === true;
	}

	private createSyntheticPage(): Page {
		return {
			id: REACT_NATIVE_RELOADABLE_PAGE_ID,
			title: "React Native Experimental (Improved Chrome Reloads)",
			vm: "don't use",
			app: this.app,
			capabilities: {},
		};
	}

	private async handleMessageFromDevice(
		message: MessageFromDevice,
	): Promise<void> {
		if (message.event === "getPages") {
			this.pages = new Map(
				message.payload.map((page: PageFromDevice) => {
					const { capabilities = {}, ...rest } = page;
					return [
						rest.id,
						{
							...rest,
							capabilities,
						},
					];
				}),
			);

			for (const page of this.pages.values()) {
				if (this.pageHasCapability(page, "nativePageReloads")) {
					continue;
				}

				if (page.title.includes("React")) {
					if (page.id !== this.lastConnectedLegacyReactNativePage?.id) {
						this.newLegacyReactNativePage(page);
						break;
					}
				}
			}
		} else if (message.event === "disconnect") {
			const pageId = message.payload.pageId;
			const page = this.pages.get(pageId);

			if (page && this.pageHasCapability(page, "nativePageReloads")) {
				return;
			}

			const debuggerSocket = this.debuggerConnection?.socket;
			if (debuggerSocket && debuggerSocket.readyState === WS.OPEN) {
				if (
					this.debuggerConnection &&
					this.debuggerConnection.pageId !== REACT_NATIVE_RELOADABLE_PAGE_ID
				) {
					debug(`Legacy page ${pageId} is reloading.`);
					debuggerSocket.send(JSON.stringify({ method: "reload" }));
				}
			}
		} else if (message.event === "wrappedEvent") {
			if (!this.debuggerConnection) {
				return;
			}

			const debuggerSocket = this.debuggerConnection.socket;
			if (!debuggerSocket || debuggerSocket.readyState !== WS.OPEN) {
				return;
			}

			const parsedPayload = JSON.parse(message.payload.wrappedEvent);
			const pageId = this.debuggerConnection.pageId;

			if ("id" in parsedPayload) {
				this.deviceEventReporter?.logResponse(parsedPayload, "device", {
					pageId,
					frontendUserAgent: this.debuggerConnection.userAgent,
					prefersFuseboxFrontend: this.isPageFuseboxFrontend(pageId),
				});
			}

			if (
				this.debuggerConnection.customHandler?.handleDeviceMessage(
					parsedPayload,
				) === true
			) {
				return;
			}

			await this.processMessageFromDeviceLegacy(
				parsedPayload,
				this.debuggerConnection,
				pageId,
			);
			debuggerSocket.send(JSON.stringify(parsedPayload));
		}
	}

	private sendMessageToDevice(message: MessageToDevice): void {
		try {
			if (message.event !== "getPages") {
				debug(`(Debugger)    (Proxy) -> (Device): ${JSON.stringify(message)}`);
			}
			this.deviceSocket.send(JSON.stringify(message));
		} catch (error) {}
	}

	private newLegacyReactNativePage(page: Page): void {
		debug(`React Native page updated to ${page.id}`);
		if (
			!this.debuggerConnection ||
			this.debuggerConnection.pageId !== REACT_NATIVE_RELOADABLE_PAGE_ID
		) {
			this.lastConnectedLegacyReactNativePage = page;
			return;
		}

		const oldPageId = this.lastConnectedLegacyReactNativePage?.id;
		this.lastConnectedLegacyReactNativePage = page;
		this.isLegacyPageReloading = true;

		if (oldPageId != null) {
			this.sendDisconnectEventToDevice(oldPageId);
		}

		this.sendConnectEventToDevice(page.id);

		const toSend = [
			{ method: "Runtime.enable", id: 1e9 },
			{ method: "Debugger.enable", id: 1e9 },
		];

		for (const message of toSend) {
			const pageId = this.debuggerConnection?.pageId ?? null;
			this.deviceEventReporter?.logRequest(message, "proxy", {
				pageId,
				frontendUserAgent: this.debuggerConnection?.userAgent ?? null,
				prefersFuseboxFrontend: this.isPageFuseboxFrontend(pageId),
			});
			this.sendMessageToDevice({
				event: "wrappedEvent",
				payload: {
					pageId: this.mapToDevicePageId(page.id),
					wrappedEvent: JSON.stringify(message),
				},
			});
		}
	}

	private async processMessageFromDeviceLegacy(
		payload: CDPServerMessage,
		debuggerInfo: DebuggerConnection,
		pageId: string | null,
	) {
		const page = pageId != null ? this.pages.get(pageId) : null;

		if (
			(!page || !this.pageHasCapability(page, "nativeSourceCodeFetching")) &&
			payload.method === "Debugger.scriptParsed" &&
			// @ts-ignore
			payload.params != null
		) {
			// @ts-ignore
			const params = payload.params;

			if ("sourceMapURL" in params) {
				for (const hostToRewrite of REWRITE_HOSTS_TO_LOCALHOST) {
					if (params.sourceMapURL.includes(hostToRewrite)) {
						// @ts-ignore
						payload.params.sourceMapURL = params.sourceMapURL.replace(
							hostToRewrite,
							"localhost",
						);
						debuggerInfo.originalSourceURLAddress = hostToRewrite;
					}
				}

				const sourceMapURL = this.tryParseHTTPURL(params.sourceMapURL);
				if (sourceMapURL) {
					try {
						const sourceMap = await this.fetchText(sourceMapURL);
						// @ts-ignore
						payload.params.sourceMapURL = `data:application/json;charset=utf-8;base64,${Buffer.from(sourceMap).toString("base64")}`;
					} catch (exception) {
						const exceptionMessage =
							exception instanceof Error
								? exception.message
								: String(exception);

						this.sendErrorToDebugger(
							`Failed to fetch source map ${params.sourceMapURL}: ${exceptionMessage}`,
						);
					}
				}
			}
			if ("url" in params) {
				for (const hostToRewrite of REWRITE_HOSTS_TO_LOCALHOST) {
					if (params?.url?.includes(hostToRewrite)) {
						payload.params.url = params.url.replace(hostToRewrite, "localhost");
						debuggerInfo.originalSourceURLAddress = hostToRewrite;
					}
				}

				if (payload.params.url.match(/^[0-9a-z]+$/)) {
					payload.params.url = FILE_PREFIX + payload.params.url;
					debuggerInfo.prependedFilePrefix = true;
				}

				if (params.scriptId != null) {
					this.scriptIdToSourcePathMapping.set(params.scriptId, params.url);
				}
			}
		}

		if (
			payload.method === "Runtime.executionContextCreated" &&
			this.isLegacyPageReloading
		) {
			debuggerInfo.socket.send(
				JSON.stringify({ method: "Runtime.executionContextsCleared" }),
			);

			const resumeMessage = { method: "Debugger.resume", id: 0 };
			this.deviceEventReporter?.logRequest(resumeMessage, "proxy", {
				pageId: this.debuggerConnection?.pageId ?? null,
				frontendUserAgent: this.debuggerConnection?.userAgent ?? null,
				prefersFuseboxFrontend: this.isPageFuseboxFrontend(
					this.debuggerConnection?.pageId ?? null,
				),
			});
			this.sendMessageToDevice({
				event: "wrappedEvent",
				payload: {
					pageId: this.mapToDevicePageId(debuggerInfo.pageId),
					wrappedEvent: JSON.stringify(resumeMessage),
				},
			});

			this.isLegacyPageReloading = false;
		}
	}

	private interceptClientMessageForSourceFetching(
		req: CDPClientMessage,
		debuggerInfo: DebuggerConnection,
		socket: WS,
	): CDPClientMessage | null {
		switch (req.method) {
			case "Debugger.setBreakpointByUrl":
				return this.processDebuggerSetBreakpointByUrl(req, debuggerInfo);
			case "Debugger.getScriptSource":
				this.processDebuggerGetScriptSource(req, socket);
				return null;
			default:
				return req;
		}
	}

	private processDebuggerSetBreakpointByUrl(
		req: any,
		debuggerInfo: DebuggerConnection,
	): CDPRequest<"Debugger.setBreakpointByUrl"> {
		if (debuggerInfo.originalSourceURLAddress != null) {
			const processedReq = { ...req, params: { ...req.params } };
			if (processedReq.params.url != null) {
				processedReq.params.url = processedReq.params.url.replace(
					"localhost",
					debuggerInfo.originalSourceURLAddress,
				);

				if (
					processedReq.params.url?.startsWith(FILE_PREFIX) &&
					debuggerInfo.prependedFilePrefix
				) {
					processedReq.params.url = processedReq.params.url.slice(
						FILE_PREFIX.length,
					);
				}
			}
			if (processedReq.params.urlRegex != null) {
				processedReq.params.urlRegex = processedReq.params.urlRegex.replace(
					/localhost/g,
					debuggerInfo.originalSourceURLAddress,
				);
			}
			return processedReq;
		}
		return req;
	}

	private processDebuggerGetScriptSource(
		req: CDPRequest<"Debugger.getScriptSource">,
		socket: WS,
	): void {
		const sendSuccessResponse = (scriptSource: string) => {
			const result = { scriptSource };
			const response = {
				id: req.id,
				result,
			};
			socket.send(JSON.stringify(response));
			const pageId = this.debuggerConnection?.pageId ?? null;
			this.deviceEventReporter?.logResponse(response, "proxy", {
				pageId,
				frontendUserAgent: this.debuggerConnection?.userAgent ?? null,
				prefersFuseboxFrontend: this.isPageFuseboxFrontend(pageId),
			});
		};

		const sendErrorResponse = (error: string) => {
			const result = { error: { message: error } };
			const response = { id: req.id, result };
			socket.send(JSON.stringify(response));
			this.sendErrorToDebugger(error);
			const pageId = this.debuggerConnection?.pageId ?? null;
			this.deviceEventReporter?.logResponse(response, "proxy", {
				pageId,
				frontendUserAgent: this.debuggerConnection?.userAgent ?? null,
				prefersFuseboxFrontend: this.isPageFuseboxFrontend(pageId),
			});
		};

		const pathToSource = this.scriptIdToSourcePathMapping.get(
			req.params.scriptId,
		);
		if (pathToSource != null) {
			const httpURL = this.tryParseHTTPURL(pathToSource);
			if (httpURL) {
				this.fetchText(httpURL).then(
					(text) => sendSuccessResponse(text),
					(err) =>
						sendErrorResponse(
							`Failed to fetch source url ${pathToSource}: ${err.message}`,
						),
				);
			} else {
				let file: string;
				try {
					file = fs.readFileSync(
						path.resolve(this.projectRoot, pathToSource),
						"utf8",
					);
					sendSuccessResponse(file);
				} catch (err) {
					const exceptionMessage =
						err instanceof Error ? err.message : String(err);
					sendErrorResponse(
						`Failed to fetch source file ${pathToSource}: ${exceptionMessage}`,
					);
				}
			}
		}
	}

	private mapToDevicePageId(pageId: string): string {
		if (
			pageId === REACT_NATIVE_RELOADABLE_PAGE_ID &&
			this.lastConnectedLegacyReactNativePage != null
		) {
			return this.lastConnectedLegacyReactNativePage.id;
		}
		return pageId;
	}

	private tryParseHTTPURL(url: string): URL | null {
		let parsedURL: URL | null = null;
		try {
			parsedURL = new URL(url);
		} catch {}

		const protocol = parsedURL?.protocol;
		if (protocol !== "http:" && protocol !== "https:") {
			parsedURL = null;
		}

		return parsedURL;
	}

	private async fetchText(url: URL): Promise<string> {
		const response = await fetch(url.toString());
		if (!response.ok) {
			throw new Error(`HTTP ${response.status} ${response.statusText}`);
		}
		const text = await response.text();
		if (text.length > 350000000) {
			throw new Error("file too large to fetch via HTTP");
		}
		return text;
	}

	private sendErrorToDebugger(message: string): void {
		const debuggerSocket = this.debuggerConnection?.socket;
		if (debuggerSocket && debuggerSocket.readyState === WS.OPEN) {
			debuggerSocket.send(
				JSON.stringify({
					method: "Runtime.consoleAPICalled",
					params: {
						args: [
							{
								type: "string",
								value: message,
							},
						],
						executionContextId: 0,
						type: "error",
					},
				}),
			);
		}
	}

	private isPageFuseboxFrontend(pageId: string | null): boolean | null {
		const page = pageId == null ? null : this.pages.get(pageId);
		if (page == null) {
			return null;
		}
		return this.pageHasCapability(page, "prefersFuseboxFrontend");
	}

	dangerouslyGetSocket(): WS {
		return this.deviceSocket;
	}
}

const invariant = (condition: boolean, message: string): void => {
	if (!condition) {
		throw new Error(message);
	}
};
