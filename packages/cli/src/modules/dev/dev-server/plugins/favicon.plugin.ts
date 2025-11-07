import fastifyFavicon from "fastify-favicon";
import fastifyPlugin from "fastify-plugin";
import path from "node:path";
import { fileURLToPath } from "node:url";

// @ts-ignore
const dirname = path.dirname(fileURLToPath(import.meta.url));
const pathToImgDir = path.join(dirname, "../../../../../assets");

export const faviconPlugin = fastifyPlugin(
	async (instance) => {
		instance.register(fastifyFavicon, { path: pathToImgDir });
	},
	{
		name: "favicon-plugin",
	},
);
