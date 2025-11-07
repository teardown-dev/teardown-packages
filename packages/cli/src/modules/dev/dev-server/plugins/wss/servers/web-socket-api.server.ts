import type { FastifyInstance } from "fastify";
import type WebSocket from "ws";
import { WebSocketServer } from "../web-socket-server";

/**
 * Class for creating a WebSocket server for API clients.
 * Useful to listening for compilation events and new logs.
 *
 * @category Development server
 */
export class WebSocketApiServer extends WebSocketServer {
	private clients = new Map<string, WebSocket>();
	private nextClientId = 0;

	/**
	 * Create new instance of WebSocketApiServer and attach it to the given Fastify instance.
	 * Any logging information, will be passed through standard `fastify.log` API.
	 *
	 * @param fastify Fastify instance to attach the WebSocket server to.
	 */
	constructor(fastify: FastifyInstance) {
		super(fastify, "/api-console");
	}

	/**
	 * Send message to all connected API clients.
	 *
	 * @param event Event string or object to send.
	 */
	send(event: unknown) {
		if (this.clients.size === 0) {
			this.fastify.log.debug({
				msg: "No API clients connected, skipping message",
			});
			return;
		}

		const data = typeof event === "string" ? event : JSON.stringify(event);

		this.fastify.log.info({
			msg: "Sending message to API clients",
			data,
			clients: this.clients.size,
		});

		for (const [, socket] of this.clients.entries()) {
			try {
				socket.send(data);
			} catch (error) {
				this.fastify.log.error({
					msg: "Error sending message to API client",
					error,
				});
			}
		}
	}

	/**
	 * Process new WebSocket connection from client application.
	 *
	 * @param socket Incoming client's WebSocket connection.
	 */
	onConnection(socket: WebSocket) {
		const clientId = `client#${this.nextClientId++}`;
		this.clients.set(clientId, socket);

		this.fastify.log.debug({ msg: "API client connected", clientId });
		this.clients.set(clientId, socket);

		const onClose = () => {
			this.fastify.log.debug({
				msg: "API client disconnected",
				clientId,
			});
			this.clients.delete(clientId);
		};

		socket.addEventListener("error", onClose);
		socket.addEventListener("close", onClose);
	}
}
