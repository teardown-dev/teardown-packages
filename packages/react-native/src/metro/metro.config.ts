import type { MetroConfig, Middleware } from "metro-config";
import type {
	HandleFunction,
	IncomingMessage,
	NextFunction,
	NextHandleFunction,
} from "connect";
import type * as http from "node:http";
import connect from "connect";
import compression from "compression";
import { parse } from "node:url";
import {
	WebSocketServer,
	type WebSocket,
	type RawData as WebSocketRawData,
} from "ws";
import {
	format as prettyFormat,
	plugins as prettyPlugins,
} from "pretty-format";
import { TLSSocket } from "node:tls";
import net from "node:net";
import { Log } from "../utils/log";

// Add these utility middleware functions
const noCacheMiddleware: NextHandleFunction = (
	req: IncomingMessage,
	res: http.ServerResponse,
	next: NextFunction,
) => {
	res.setHeader("Surrogate-Control", "no-store");
	res.setHeader(
		"Cache-Control",
		"no-store, no-cache, must-revalidate, proxy-revalidate",
	);
	res.setHeader("Pragma", "no-cache");
	res.setHeader("Expires", "0");
	next();
};

function getServerBase(req: IncomingMessage): string {
	const scheme =
		req.socket instanceof TLSSocket && req.socket.encrypted === true
			? "https"
			: "http";
	const { localAddress, localPort } = req.socket;
	const address =
		localAddress && net.isIPv6(localAddress)
			? `[${localAddress}]`
			: localAddress;
	return `${scheme}:${address}:${localPort}`;
}

// Create socket types and utilities
type SocketId = string;
type MessageSocketOptions = {
	logger: Logger;
};

interface SocketMap {
	map: Map<SocketId, WebSocket>;
	registerSocket: (socket: WebSocket) => {
		id: SocketId;
		terminate: () => void;
	};
	findSocket: (id: SocketId) => WebSocket | undefined;
}

function createSocketMap(): SocketMap {
	const map = new Map<SocketId, WebSocket>();

	return {
		map,
		registerSocket(socket: WebSocket) {
			const id = Math.random().toString(36).slice(2);
			map.set(id, socket);
			return {
				id,
				terminate: () => {
					map.delete(id);
					socket.terminate();
				},
			};
		},
		findSocket(id: SocketId) {
			return map.get(id);
		},
	};
}

function createBroadcaster(sockets: Map<SocketId, WebSocket>) {
	return (excludeId: SocketId | null, data: string) => {
		sockets.forEach((socket, id) => {
			if (id !== excludeId) {
				socket.send(data);
			}
		});
	};
}

// Utility functions for message handling
function parseRawMessage<T>(
	data: WebSocketRawData,
	isBinary: boolean,
): T | null {
	if (isBinary) return null;
	try {
		return JSON.parse(data.toString());
	} catch {
		return null;
	}
}

function serializeMessage(message: any): string {
	return JSON.stringify(message);
}

export function createMessagesSocket(options: MessageSocketOptions) {
	const clients = createSocketMap();
	const broadcast = createBroadcaster(clients.map);

	const server = new WebSocketServer({ noServer: true });

	server.on("connection", (socket, req) => {
		const client = clients.registerSocket(socket);

		if (req.url) {
			Object.defineProperty(socket, "_upgradeQuery", {
				value: parse(req.url).query,
			});
		}

		socket.on("close", client.terminate);
		socket.on("error", client.terminate);
	});

	return {
		endpoint: "/message" as const,
		server,
		broadcast: (method: string, params?: Record<string, any>) => {
			if (clients.map.size === 0) {
				return options.logger.warn(
					`No apps connected. Sending "${method}" to all React Native apps failed.`,
				);
			}
			broadcast(null, serializeMessage({ method, params }));
		},
	};
}

function getServerConfig(): MetroConfig["server"] {
	// const middleware = connect()
	// 	.use(noCacheMiddleware as connect.HandleFunction)
	// 	.use(compression() as connect.HandleFunction);

	return {
		enhanceMiddleware: (metroMiddleware) => {
			console.log("enhanceMiddleware", metroMiddleware);
			return (
				req: IncomingMessage,
				res: http.ServerResponse,
				next: NextFunction,
			) => {
				console.log("enhanceMiddleware", req, res, next);
				// middleware(req, res, (err?: Error) => {
				// 	if (err) return next(err);
				// 	debugMiddleware.debugMiddleware(req, res, (err?: Error) => {
				// 		if (err) return next(err);
				// 		return metroMiddleware(req, res, next);
				// 	});
				// });
			};
		},
	};
}

export function getMetroConfig(): MetroConfig {
	return {
		server: getServerConfig(),
	};
}

// export function createMetroMiddleware(
// 	metroConfig: Pick<MetroConfig, "projectRoot">,
// ) {
// 	const messages = createMessagesSocket({ logger: Log });
// 	const events = createEventsSocket(messages);

// 	const middleware = connect().use(noCacheMiddleware);
// 	//   .use(compression())
// 	//   // Support opening stack frames from clients directly in the editor
// 	//   .use('/open-stack-frame', rawBodyMiddleware)
// 	//   .use('/open-stack-frame', metroOpenStackFrameMiddleware)
// 	//   // Support the symbolication endpoint of Metro
// 	//   // See: https://github.com/facebook/metro/blob/a792d85ffde3c21c3fbf64ac9404ab0afe5ff957/packages/metro/src/Server.js#L1266
// 	//   .use('/symbolicate', rawBodyMiddleware)
// 	//   // Support status check to detect if the packager needs to be started from the native side
// 	//   .use('/status', createMetroStatusMiddleware(metroConfig));

// 	return {
// 		middleware,
// 		messagesSocket: messages,
// 		eventsSocket: events,
// 		websocketEndpoints: {
// 			[messages.endpoint]: messages.server,
// 			[events.endpoint]: events.server,
// 		},
// 	};
// }

// type Command = {
// 	type: "command";
// 	command: string;
// 	params?: any;
// };

// function serializeMetroEvent(message: any): string {
// 	// Some types reported by Metro are not serializable
// 	if (message?.error instanceof Error) {
// 		return serializeMessage({
// 			...message,
// 			error: prettyFormat(message.error, {
// 				escapeString: true,
// 				highlight: true,
// 				maxDepth: 3,
// 				min: true,
// 			}),
// 		});
// 	}

// 	if (message && message.type === "client_log") {
// 		return serializeMessage({
// 			...message,
// 			data: message.data.map((item: any) =>
// 				typeof item === "string"
// 					? item
// 					: prettyFormat(item, {
// 							escapeString: true,
// 							highlight: true,
// 							maxDepth: 3,
// 							min: true,
// 							plugins: [prettyPlugins.ReactElement],
// 						}),
// 			),
// 		});
// 	}

// 	return serializeMessage(message);
// }

// type EventsSocketOptions = {
// 	/** The message endpoint broadcaster, used to relay commands from Metro */
// 	broadcast: ReturnType<typeof createMessagesSocket>["broadcast"];
// };

// function createEventsSocket(options: EventsSocketOptions) {
// 	const clients = createSocketMap();
// 	const broadcast = createBroadcaster(clients.map);

// 	const server = new WebSocketServer({
// 		noServer: true,
// 		verifyClient({ origin }: { origin: string }) {
// 			return (
// 				!origin ||
// 				origin.startsWith("http://localhost:") ||
// 				origin.startsWith("file:")
// 			);
// 		},
// 	});

// 	server.on("connection", (socket) => {
// 		const client = clients.registerSocket(socket);

// 		// Register disconnect handlers
// 		socket.on("close", client.terminate);
// 		socket.on("error", client.terminate);
// 		// Register message handler
// 		socket.on("message", (data, isBinary) => {
// 			const message = parseRawMessage<Command>(data, isBinary);
// 			if (!message) return;

// 			if (message.type === "command") {
// 				options.broadcast(message.command, message.params);
// 			} else {
// 				debug(`Received unknown message type: ${message.type}`);
// 			}
// 		});
// 	});

// 	return {
// 		endpoint: "/events" as const,
// 		server,
// 		reportMetroEvent: (event: any) => {
// 			// Avoid serializing data if there are no clients
// 			if (!clients.map.size) {
// 				return;
// 			}

// 			return broadcast(null, serializeMetroEvent(event));
// 		},
// 	};
// }

// const debug = require("debug")(
// 	"expo:metro:devserver:eventsSocket",
// ) as typeof console.log;
