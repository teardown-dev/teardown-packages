import type { IncomingMessage } from "node:http";
import { URL } from "node:url";
import type { FastifyInstance } from "fastify";
import type WebSocket from "ws";
import { WebSocketServer } from "../web-socket-server";
// @ts-ignore
import MetroHmrServer from "metro/src/HmrServer";
import type { ConfigT } from "metro-config";
// @ts-ignore
import type MetroServer from "metro/src/Server";
import { WebSocketServerAdapter } from "../web-socket-server-adapter";

/**
 * Class for creating a WebSocket server for Hot Module Replacement.
 *
 * @category Development server
 */
export class WebSocketHMRServer extends WebSocketServer {
	private clients = new Map<
		{ clientId: string; platform: string },
		WebSocket
	>();
	private nextClientId = 0;

	private hmrServer: MetroHmrServer;

	/**
	 * Create new instance of WebSocketHMRServer and attach it to the given Fastify instance.
	 * Any logging information, will be passed through standard `fastify.log` API.
	 *
	 * @param fastify Fastify instance to attach the WebSocket server to.
	 * @param delegate HMR delegate instance.
	 */
	constructor(
		fastify: FastifyInstance,
		private options: {
			metroConfig: ConfigT;
			metroServer: MetroServer;
			onClientConnected: (platform: string, clientId: string) => void;
		},
	) {
		super(fastify, "/hot");

		this.hmrServer = new MetroHmrServer(
			this.options.metroServer.getBundler(),
			this.options.metroServer.getCreateModuleId(),
			this.options.metroConfig,
		);
	}

	/**
	 * Send action to all connected HMR clients.
	 *
	 * @param event Event to send to the clients.
	 * @param platform Platform of clients to send the event to.
	 * @param clientIds Ids of clients who should receive the event.
	 */
	send(event: any, platform: string, clientIds?: string[]) {
		const data = typeof event === "string" ? event : JSON.stringify(event);

		for (const [key, socket] of this.clients) {
			if (
				key.platform !== platform ||
				!(clientIds ?? [key.clientId]).includes(key.clientId)
			) {
				continue;
			}

			try {
				socket.send(data);
			} catch (error) {
				this.fastify.log.error({
					msg: "Cannot send action to client",
					event,
					error,
					...key,
				});
			}
		}
	}

	/**
	 * Process new WebSocket connection from HMR client.
	 *
	 * @param socket Incoming HMR client's WebSocket connection.
	 */
	async onConnection(socket: WebSocket, request: IncomingMessage) {
		const requestUrl = request.url || "";

		const { searchParams } = new URL(requestUrl, "http://localhost");
		const platform = searchParams.get("platform") ?? "unknown";

		if (!platform) {
			this.fastify.log.debug({
				msg: "HMR connection disconnected - missing platform",
			});
			socket.close();
			return;
		}

		const clientId = `client#${this.nextClientId++}`;

		const client = {
			clientId,
			platform,
		};

		this.clients.set(client, socket);

		this.fastify.log.debug({ msg: "HMR client connected", ...client });

		const onClose = () => {
			this.fastify.log.debug({
				msg: "HMR client disconnected",
				...client,
			});
			this.clients.delete(client);
		};

		socket.addEventListener("error", onClose);
		socket.addEventListener("close", onClose);

		await this.registerHMRClient(socket, requestUrl);

		this.options.onClientConnected(platform, clientId);
	}

	async registerHMRClient(socket: WebSocket, requestUrl: string) {
		this.fastify.log.debug({
			msg: "HMR client connected",
			requestUrl,
		});

		type Client = {
			optedIntoHMR: boolean;
			revisionIds: Array<string>;
			sendFn: (data: string) => void;
		};

		const sendFn = (...args: any[]) => {
			this.fastify.log.debug({
				msg: "HMR client message",
				args,
			});
			// @ts-ignore
			socket.send(...args);
		};

		const hmrClient: Client = await this.hmrServer.onClientConnect(
			requestUrl,
			sendFn,
		);

		socket.on("error", (error) => {
			this.fastify.log.error({
				msg: "HMR client error",
				error,
			});
			this.hmrServer.onClientError(hmrClient, error);
		});

		socket.on("close", () => {
			this.fastify.log.debug({
				msg: "HMR client disconnected",
				...hmrClient,
			});
			this.hmrServer.onClientDisconnect(hmrClient);
		});

		socket.on("message", (data) => {
			this.fastify.log.debug({
				msg: "HMR client message",
				data,
			});
			this.hmrServer.onClientMessage(hmrClient, data, sendFn);
		});
	}
}
