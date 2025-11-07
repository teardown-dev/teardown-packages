import { $ } from "bun";

export type InitTeardownOptions = {
	projectName: string;
};

export class InitTeardown {
	constructor(readonly options: InitTeardownOptions) {}

	async init() {
		console.log("Initializing Teardown...");
		const projectLocation = await this.getProjectLocation();
		console.log(projectLocation);
	}

	async getProjectLocation() {
		try {
			const projectLocation = await $`pwd`;
			return projectLocation.text().trim();
		} catch (error) {
			console.error("Error getting project location:", error);
			throw error;
		}
	}

	// what we want to do is to install Teardown packages into a react native prokject
	// @teardown/react-native
}
