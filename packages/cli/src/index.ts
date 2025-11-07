import { Command } from "commander";
import { DevServerCommand } from "./commands/dev/dev";

const program = new Command();

program
	.name("Teardown CLI")
	.description("CLI to use the Teardown")
	.version("0.0.1");

// program
// 	.command("init")
// 	.description("Initialize Teardown in the current project")
// 	.action(async () => {
// 		const project = await import("./commands/init/init-teardown");
// 		await new project.InitTeardown({
// 			projectName: "example ",
// 		}).init();
// 	});

program.addCommand(new DevServerCommand().createCommand());

program.parse();
