import { Command } from "commander";

const program = new Command();

program
	.name("Teardown CLI")
	.description("CLI to use the Teardown")
	.version("0.0.1");

program
	.command("init")
	.description("Initialize Teardown in the current project")
	.action(async () => {
		const project = await import("./commands/init/init-teardown");
		await new project.InitTeardown({
			projectName: "example ",
		}).init();
	});

program
	.command("dev")
	.description("Start the development server")
	.option("-p, --port <number>", "Port to start the server on", "8081")
	.option("-h, --host <string>", "Host to listen on", "localhost")
	.option("--project-root <path>", "Path to project root", process.cwd())
	.action(async (options) => {
		const { Dev: DevServer } = await import("./commands/dev/dev");
		try {
			await new Dev({
				port: Number.parseInt(options.port, 10),
				host: options.host,
				projectRoot: options.projectRoot,
			}).execute();
		} catch (error) {
			console.error("Failed to start server:", error);
			process.exit(1);
		}
	});

program.parse();
