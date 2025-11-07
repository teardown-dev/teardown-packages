import {
	getNewVersion,
	gitCommands as gitCommand,
	logError,
	logStep,
	logSuccess,
	synchronizePackageVersions,
} from "./package-utils";
import type { VersionType } from "./package-utils";

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
	gitCommand([
		"add .",
		`commit -m "chore: bump version to ${newVersion}"`,
		"push origin main",
	]);
	logSuccess("🎉 Changes committed and pushed to main");

	// Create or recreate the release branch
	const branchName = `release/packages/v${newVersion}`;
	logStep(`🌿 Creating release branch: ${branchName}`);

	// Force delete the branch if it exists (both locally and remotely)
	try {
		gitCommand([
			`push origin --delete ${branchName}`,
			`branch -D ${branchName}`,
			`checkout -b ${branchName}`,
			`push -f origin ${branchName}`,
		]);
		logSuccess(`🔄 Release branch ${branchName} recreated and pushed`);
	} catch (error) {
		// If branch doesn't exist, just create it
		logStep("🌱 Branch doesn't exist, creating new branch...");
		gitCommand([`checkout -b ${branchName}`, `push -f origin ${branchName}`]);
		logSuccess(`✅ Release branch ${branchName} created and pushed`);
	}

	logSuccess("🎊 Version bump process completed successfully!");
}

if (require.main === module) {
	createPackageRelease().catch((error) => {
		logError("💥 Unhandled error", error);
		process.exit(1);
	});
}
