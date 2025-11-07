import { getPublishOrder } from "./get-package-order";
import {
	npm,
	getPackagePath,
	logStep,
	logSuccess,
	logError,
} from "./utils/package-utils";

export async function buildPackages() {
	try {
		const packages = getPublishOrder();
		logStep(`Building packages in order: ${packages.join(" -> ")}`);

		for (const packageName of packages) {
			const packageDir = getPackagePath(packageName);
			const pkg = require(`../${packageDir}/package.json`);

			if (pkg.scripts?.build) {
				logStep(`Building ${packageName}...`);
				npm.build(packageDir);
			}
		}

		logSuccess("All packages built successfully!");
	} catch (error) {
		logError("Build failed", error);
		process.exit(1);
	}
}

if (require.main === module) {
	buildPackages();
}
