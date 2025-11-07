import fastifyPlugin from "fastify-plugin";
import fs from "node:fs";
import { logger } from "@react-native-community/cli-tools";
import type { FastifyRequest, FastifyReply } from "fastify";

export const systracePlugin = fastifyPlugin(
	async (instance) => {
		instance.post(
			"/systrace",
			async (request: FastifyRequest, reply: FastifyReply) => {
				logger.info("Dumping profile information...");

				const dumpName = `/tmp/dump_${Date.now()}.json`;

				// Get the raw body from the request
				const rawBody = await request.body;
				fs.writeFileSync(dumpName, JSON.stringify(rawBody));

				const response =
					// biome-ignore lint/style/useTemplate: <explanation>
					`Your profile was saved at:\n${dumpName}\n\n` +
					'On Google Chrome navigate to chrome://tracing and then click on "load" ' +
					"to load and visualise your profile.\n\n" +
					"This message is also printed to your console by the packager so you can copy it :)";

				logger.info(response);
				return reply.send(response);
			},
		);
	},
	{
		name: "systrace-plugin",
	},
);
