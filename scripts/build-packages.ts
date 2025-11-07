import {
	getPackagePath,
	getPublishOrder,
	logError,
	logStep,
	logSuccess,
	npm,
	readPackageJson,
} from "./utils/package-utils";

async function main() {
	logStep("🏗️ Starting build process for all packages...");

	try {
		const packages = getPublishOrder();
		logStep(`Building packages in order: ${packages.join(" -> ")}`);

		for (const packageName of packages) {
			const packageDir = getPackagePath(packageName);
			const pkg = readPackageJson(packageDir);

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
	main().catch((error) => {
		logError("Unhandled error", error);
		process.exit(1);
	});
}
