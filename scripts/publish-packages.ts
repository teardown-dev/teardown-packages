import {
	getCurrentVersion,
	getPublishOrder,
	git,
	logError,
	logStep,
	logSuccess,
	npm,
} from "./utils/package-utils";

async function publishPackages() {
	const version = getCurrentVersion();
	logStep(`📦 Starting publish process for version ${version}...`);

	try {
		const packages = getPublishOrder();
		logStep(`Publishing packages in order: ${packages.join(" -> ")}`);

		let allSucceeded = true;
		const publishedPackages: string[] = [];

		// Publish packages one by one
		for (const packageName of packages) {
			try {
				const packageDir = `./packages/${packageName.replace("@teardown/", "")}`;

				// Try to publish the package
				npm.publish(packageDir);
				publishedPackages.push(packageName);
			} catch (error) {
				allSucceeded = false;
				logError(`Failed to publish ${packageName}`, error);
				break; // Stop publishing on first failure
			}
		}

		// Only create git tag if all packages were published successfully
		if (allSucceeded) {
			logStep("🏷️ All packages published successfully, creating git tag...");

			try {
				git.pull();
				// Create and push git tag
				git.tag(version, `Release version ${version}`);
				git.push(true); // Push with tags

				logSuccess(
					`🎉 Successfully published version ${version} and created git tag!`,
				);
			} catch (error) {
				logError("Failed to create git tag", error);
				process.exit(1);
			}
		} else {
			logStep(
				`⚠️ Some packages were published (${publishedPackages.join(", ")}), but not all.`,
			);
			logStep(
				"🔄 Run this script again to retry publishing the remaining packages.",
			);
			process.exit(1);
		}
	} catch (error) {
		logError("💥 Unhandled error during publish", error);
		process.exit(1);
	}
}

if (require.main === module) {
	publishPackages().catch((error) => {
		logError("💥 Unhandled error", error);
		process.exit(1);
	});
}
