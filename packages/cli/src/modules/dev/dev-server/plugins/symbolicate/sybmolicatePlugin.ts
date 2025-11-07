import fastifyPlugin from "fastify-plugin";

export const symbolicatePlugin = fastifyPlugin(
	async (instance) => {
		instance.post("/symbolicate", async (request, reply) => {
			instance.log.info("Symbolicate endpoint hit", request.body);

			const requestWithBody = request as typeof request & { rawBody: string };
			requestWithBody.rawBody = "";

			requestWithBody.raw.setEncoding("utf8");

			request.raw.on("data", (chunk: string) => {
				requestWithBody.rawBody += chunk;
			});

			requestWithBody.raw.on("end", () => {
				reply.send(requestWithBody.rawBody);
			});
		});
	},
	{
		name: "symbolicate-plugin",
		dependencies: ["@fastify/sensible"],
	},
);
