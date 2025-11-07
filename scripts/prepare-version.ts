import { getNewVersion, execCommand, gitCommand } from "./utils/package-utils";
import type { VersionType } from "./utils/package-utils";

const versionType = (process.argv[2] || "patch") as VersionType;
const getVersionOnly = process.argv.includes("--get-version");

async function prepareVersion() {
	const newVersion = await getNewVersion(versionType);

	if (getVersionOnly) {
		console.log(newVersion);
		return;
	}

	// Update versions in package.json files
	execCommand(`bun run prepare-release ${versionType}`);

	// Commit changes and push to main
	gitCommand([
		"add .",
		`commit -m "chore: bump version to ${newVersion}"`,
		"push origin main",
	]);

	// Create or recreate the release branch
	const branchName = `release/packages/v${newVersion}`;

	// Force delete the branch if it exists (both locally and remotely)
	try {
		gitCommand([
			`push origin --delete ${branchName}`,
			`branch -D ${branchName}`,
			`checkout -b ${branchName}`,
			`push -f origin ${branchName}`,
		]);
	} catch (error) {
		// If branch doesn't exist, just create it
		gitCommand([`checkout -b ${branchName}`, `push -f origin ${branchName}`]);
	}
}

prepareVersion().catch(console.error);
