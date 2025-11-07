#!/usr/bin/env bun
import {
	getPublishOrder,
	getPackagePath,
	logStep,
	logSuccess,
	logError,
	npm,
} from "./utils/package-utils";

async function publishPackages(dryRun = false) {
	try {
		const packages = getPublishOrder();
		logStep(`Publishing packages in order: ${packages.join(" -> ")}`);

		for (const packageName of packages) {
			const packageDir = getPackagePath(packageName);
			npm.publish(packageDir, dryRun);
		}

		logSuccess(
			dryRun
				? "Dry run completed successfully!"
				: "All packages published successfully!",
		);
	} catch (error) {
		logError("Failed to publish packages", error);
		process.exit(1);
	}
}

// Get dry run flag from command line arguments

if (require.main === module) {
	const dryRun = process.argv.includes("--dry-run");
	publishPackages(dryRun).catch((error) => {
		logError("Unhandled error", error);
		process.exit(1);
	});
}
