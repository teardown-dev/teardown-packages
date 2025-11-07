import { getNewVersion, execCommand, gitCommands } from "./utils/package-utils";
import type { VersionType } from "./utils/package-utils";

const versionType = (process.argv[2] || "patch") as VersionType;
const getVersionOnly = process.argv.includes("--get-version");

async function bumpPackagesVersion() {
	const newVersion = await getNewVersion(versionType);

	if (getVersionOnly) {
		console.log(newVersion);
		return;
	}

	// Update versions in package.json files
	execCommand(`bun run prepare-release ${versionType}`);

	// Commit changes and push to main
	gitCommands([
		"add .",
		`commit -m "chore: bump version to ${newVersion}"`,
		"push origin main",
	]);

	// Create or recreate the release branch
	const branchName = `release/packages/v${newVersion}`;

	// Force delete the branch if it exists (both locally and remotely)
	try {
		gitCommands([
			`push origin --delete ${branchName}`,
			`branch -D ${branchName}`,
			`checkout -b ${branchName}`,
			`push -f origin ${branchName}`,
		]);
	} catch (error) {
		// If branch doesn't exist, just create it
		gitCommands([`checkout -b ${branchName}`, `push -f origin ${branchName}`]);
	}
}

bumpPackagesVersion().catch(console.error);
