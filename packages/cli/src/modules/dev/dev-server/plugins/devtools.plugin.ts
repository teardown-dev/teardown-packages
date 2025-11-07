import fastifyPlugin from "fastify-plugin";
import open from "open";

type Options = {
	host: string | undefined;
	port: number;
	https?: {
		key: string;
		cert: string;
	};
};

export const devtoolsPlugin = fastifyPlugin<Options>(
	async (instance, options) => {
		instance.route({
			method: ["GET", "POST", "PUT"],
			url: "/reload",
			handler: (_request, reply) => {
				console.log(
					"Reload endpoint hit",
					instance.wss.messageServer.broadcast != null,
				);
				instance.wss.messageServer.broadcast("reload");
				reply.send("OK");
			},
		});

		instance.route({
			method: ["GET", "POST", "PUT"],
			url: "/launch-js-devtools",
			handler: async (request, reply) => {
				const customDebugger = process.env.REACT_DEBUGGER;
				if (customDebugger) {
					// NOOP for now
					// TODO implement opening teardown here
				} else if (!instance.wss.debuggerServer.isDebuggerConnected()) {
					const url = `${options.https ? "https" : "http"}://${
						options.host || "localhost"
					}:${options.port}/debugger-ui`;
					try {
						request.log.info({ msg: "Opening debugger UI", url });
						await open(url);
					} catch (error) {
						if (error) {
							request.log.error({
								msg: "Cannot open debugger UI",
								url,
								error,
							});
						}
					}
				}
				reply.send("OK");
			},
		});
	},
	{
		name: "devtools-plugin",
		dependencies: ["wss-plugin"],
	},
);
