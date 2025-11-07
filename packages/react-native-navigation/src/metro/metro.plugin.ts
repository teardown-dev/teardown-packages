import path from "node:path";
import chokidar from "chokidar";
import type { MetroConfig } from "metro-config";

const watcher: chokidar.FSWatcher | null = null;

export function getConfig(): MetroConfig {
	const screensDir = path.join(__dirname, "screens");
	const outputFile = path.join(__dirname, "screens.gen.tsx");

	const plugin = new TeardownMetroPlugin(screensDir, outputFile);
	plugin.startWatching();

	return {};
}

class TeardownMetroPlugin {
	watcher: chokidar.FSWatcher | null = null;

	constructor(
		readonly screensDir: string,
		readonly outputFile: string,
	) {}

	startWatching() {
		this.watcher = chokidar.watch(this.screensDir, {
			ignored: /(^|[\/\\])\../,
			persistent: true,
		});

		if (this.watcher == null) {
			console.error("Failed to initialize watcher");
			return;
		}

		this.watcher
			.on("add", this.generateOutputFile)
			.on("change", this.generateOutputFile)
			.on("unlink", this.generateOutputFile)
			.on("ready", this.generateOutputFile) // Generate the initial output file
			.on("error", (error) => console.error(`Watcher error: ${error}`));

		console.log(`Watching ${this.screensDir} for changes...`);
	}

	cleanup() {
		if (this.watcher != null) {
			this.watcher.close();
		}
	}

	getRootLayout() {
		return `
			
			/* Root layout */
			// const RootStack = createNativeStackNavigator();
			//
			// declare module "@teardown/react-native-navigation" {
			// 	interface Register {
			// 		router: typeof router;
			// 	}
			// }
			//
			// type TeardownRouterProps<Screens> = {
			// 	router: Router<Screens>;
			// };
			//
			
		
		`;
	}

	generateOutputFile() {
		const outputContent = "/* Generated file */";
		console.log("Generating output file...");
		// fs.writeFileSync(outputFile, outputContent);
	}
}
