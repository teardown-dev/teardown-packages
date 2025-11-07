import { execSync } from "node:child_process";
import {
	getPackageDirs,
	logError,
	logStep,
	logSuccess,
	readPackageJson,
} from "./utils/package-utils";

async function linkPackages() {
	try {
		const packageDirs = getPackageDirs();
		logStep(`Linking ${packageDirs.length} packages...`);

		for (const packageDir of packageDirs) {
			try {
				const pkg = readPackageJson(packageDir);
				logStep(`Linking ${pkg.name}...`);

				// Run bun link in the package directory
				execSync(`cd ${packageDir} && bun link`, {
					stdio: "inherit",
				});

				logSuccess(`Linked ${pkg.name}`);
			} catch (error) {
				logError(`Failed to link package in ${packageDir}`, error);
				// Continue with other packages even if one fails
			}
		}

		logSuccess("All packages linked successfully!");
	} catch (error) {
		logError("Package linking failed", error);
		process.exit(1);
	}
}

if (require.main === module) {
	linkPackages().catch((error) => {
		logError("Unhandled error", error);
		process.exit(1);
	});
}
