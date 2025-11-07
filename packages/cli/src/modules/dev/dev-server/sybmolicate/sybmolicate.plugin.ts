import fastifyPlugin from "fastify-plugin";
import type { IncomingMessageExtended } from "@fastify/middie";
import type http from "node:http";

export type SymbolicateRequest = http.IncomingMessage &
	IncomingMessageExtended & { rawBody: string };
export type SymbolicateReply = http.ServerResponse;

type SymbolicatePluginOptions = {
	onSymbolicate: (request: SymbolicateRequest, reply: SymbolicateReply) => void;
};

export const symbolicatePlugin = fastifyPlugin<SymbolicatePluginOptions>(
	async (instance, options) => {
		instance.log.info("Symbolicate plugin registered");

		instance.use((request, reply, next) => {
			if (request.url !== "/symbolicate") {
				next();
				return;
			}

			instance.log.info("symbolicate onRequest", request.url);
			const requestWithBody = request as SymbolicateRequest;
			requestWithBody.rawBody = "";
			requestWithBody.setEncoding("utf8");
			requestWithBody.on("data", (chunk) => {
				requestWithBody.rawBody += chunk;
			});
			requestWithBody.on("end", () => {
				if (request.url === "/symbolicate") {
					options.onSymbolicate(requestWithBody, reply);
				}

				next();
			});
		});
	},
	{
		name: "symbolicate-plugin",
		dependencies: ["@fastify/sensible"],
	},
);

// export const rawBodyPlugin = fastifyPlugin<{
// 	rawBody: string;
// }>((instance, options) => {
// 	instance.addHook("preHandler", (request, reply, next) => {
// 		// request.rawBody = "";
// 		next();
// 	});
// });
