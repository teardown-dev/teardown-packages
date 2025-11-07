import fastifyPlugin from "fastify-plugin";

export const symbolicatePlugin = fastifyPlugin(
	async (instance) => {
		console.log("Symbolicate plugin registered");
		instance.all("/symbolicate", async (request, reply) => {
			console.log("Symbolicate endpoint hit", request.body);

			instance.log.info("Symbolicate endpoint hit", request.body);

			const requestWithBody = request as typeof request & { rawBody: string };
			console.log("requestWithBody", requestWithBody);
			requestWithBody.rawBody = "";

			requestWithBody.raw.setEncoding("utf8");

			request.raw.on("data", (chunk: string) => {
				requestWithBody.rawBody += chunk;
			});

			requestWithBody.raw.on("end", () => {
				console.log("END requestWithBody", requestWithBody);
				reply.send(requestWithBody.rawBody);
			});
		});
	},
	{
		name: "symbolicate-plugin",
		dependencies: ["@fastify/sensible"],
	},
);
