import {
	getPublishOrder,
	buildPackages,
	replaceLinkedDependencies,
	updateVersions,
	git,
	npm,
	getPackagePath,
	delay,
	logStep,
	logSuccess,
	logSkip,
	logError,
	readPackageJson,
} from "./utils/package-utils";

export async function publishPackages() {
	try {
		// 1. Build all packages first
		await buildPackages();

		// 2. Temporarily replace linked dependencies
		logStep("Replacing linked dependencies for publishing...");
		replaceLinkedDependencies();

		// 3. Publish packages in correct order
		const publishOrder = getPublishOrder();
		logStep(`Publishing packages in order: ${publishOrder.join(" -> ")}`);

		for (const packageName of publishOrder) {
			const packageDir = getPackagePath(packageName);
			const pkg = readPackageJson(packageDir);

			if (pkg.private) {
				logSkip(`Skipping private package ${packageName}`);
				continue;
			}

			logStep(`Publishing ${packageName}...`);
			npm.publish(packageDir);

			// Small delay between publishes
			await delay(5000);
		}

		// 4. Revert temporary changes and bump patch version
		logStep("Reverting temporary dependency changes...");
		git.reset();

		// 5. Bump to next patch version
		logStep("Bumping to next patch version...");
		const nextVersion = updateVersions("patch");
		git.commit(`chore: prepare next version ${nextVersion}`);
		git.push();

		logSuccess("Publish complete!");
	} catch (error) {
		logError("Publish failed", error);
		// Ensure we revert any temporary changes on failure
		git.reset();
		process.exit(1);
	}
}

if (require.main === module) {
	publishPackages();
}
