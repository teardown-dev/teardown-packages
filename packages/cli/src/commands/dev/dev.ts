import type { StartOptions as DevOptions } from "./types";

export class DevServer {
	private options: DevOptions;

	constructor(options: DevOptions) {
		this.options = options;
	}

	async execute(): Promise<void> {
		try {
			console.log("Starting development server...");
		} catch (error) {
			console.error("Failed to start development server:", error);
			throw error;
		}
	}
}
