import {
	getNewVersion,
	git,
	gitCommands as gitCommand,
	logError,
	logStep,
	logSuccess,
	synchronizePackageVersions,
} from "./utils/package-utils";
import type { VersionType } from "./utils/package-utils";

const versionType = (process.argv[2] || "patch") as VersionType;
const getVersionOnly = process.argv.includes("--get-version");

async function createPackageRelease() {
	logStep("🚀 Starting version bump process...");
	const newVersion = await getNewVersion(versionType);
	logSuccess(`📦 New version will be: ${newVersion}`);

	if (getVersionOnly) {
		console.log(newVersion);
		return;
	}

	// Update versions in package.json files
	logStep("📝 Updating package versions...");
	await synchronizePackageVersions(versionType);
	logSuccess("✨ Package versions updated successfully");
	// Commit changes and push to main
	logStep("💫 Committing changes and pushing to main...");
	git.addAll();
	git.commit(`chore: bump version to ${newVersion}`);
	// git.push();

	logSuccess("🎊 Version bump process completed successfully!");
}

if (require.main === module) {
	createPackageRelease().catch((error) => {
		logError("💥 Unhandled error", error);
		process.exit(1);
	});
}
