import path from "node:path";
import { Command } from "commander";
import { DevServer } from "../../modules/dev/server";

export interface DevServerOptions {
	projectRoot: string;
	port: number;
	host: string;
	config: string;
	entryFile: string;
	resetCache: boolean;
	watchFolders?: string[];
	assetPlugins?: string[];
	sourceExts?: string[];
	maxWorkers?: number;
	transformer?: string;
	https?: boolean;
	key?: string;
	cert?: string;
	interactive?: boolean;
}

export class DevServerCommand {
	createCommand(): Command {
		const command = new Command("dev")
			.description("Start the development server")
			.option("-p, --port <number>", "Port to start the server on", "8081")
			.option("-h, --host <string>", "Host to listen on", "127.0.0.1")
			.option("--project-root <path>", "Path to project root", process.cwd())
			.option(
				"--watch-folders <list>",
				"Specify additional folders to watch",
				(val: string) => val.split(",").map((folder) => path.resolve(folder)),
			)
			.option(
				"--asset-plugins <list>",
				"Specify additional asset plugins",
				(val: string) => val.split(","),
			)
			.option(
				"--source-exts <list>",
				"Specify additional source extensions",
				(val: string) => val.split(","),
			)
			.option(
				"--max-workers <number>",
				"Maximum number of workers for transformation",
				(val: string) => Number(val),
			)
			.option("--transformer <string>", "Specify a custom transformer")
			.option("--entry-file <path>", "Path to entry file", "index.js")
			.option("--reset-cache", "Reset the metro cache", false)
			.option("--https", "Enable HTTPS connections")
			.option("--key <path>", "Path to SSL key")
			.option("--cert <path>", "Path to SSL certificate")
			.option("--config <path>", "Path to config file", (val: string) =>
				path.resolve(val),
			)
			.option("--no-interactive", "Disable interactive mode");

		command.action(this.action);

		return command;
	}

	private async action(options: DevServerOptions): Promise<void> {
		try {
			const server = new DevServer(options);
			await server.start();
		} catch (error) {
			console.error("Failed to start development server:", error);
			throw error;
		}
	}
}
