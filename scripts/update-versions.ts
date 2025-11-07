import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Helper to check if a string is a valid semver-like version
const isValidVersion = (version: string) =>
	/^\d+\.\d+\.\d+(-[\w-]+)?$/.test(version);

// Helper to increment version based on release type
function incrementVersion(
	currentVersion: string,
	releaseType: "major" | "minor" | "patch",
): string {
	const [major, minor, patch] = currentVersion
		.split("-")[0]
		.split(".")
		.map(Number);

	switch (releaseType) {
		case "major":
			return `${major + 1}.0.0`;
		case "minor":
			return `${major}.${minor + 1}.0`;
		case "patch":
			return `${major}.${minor}.${patch + 1}`;
		default:
			return currentVersion;
	}
}

export function updateVersions(releaseType?: "major" | "minor" | "patch") {
	const PACKAGES_DIR = "./packages";

	// If no version is provided, read the root package.json to get current version
	let NEW_VERSION: string;

	try {
		const rootPkg = JSON.parse(readFileSync("./package.json", "utf-8"));
		NEW_VERSION = releaseType
			? incrementVersion(rootPkg.version, releaseType)
			: process.env.VERSION || rootPkg.version;
	} catch (error) {
		NEW_VERSION = process.env.VERSION || "0.0.0";
	}

	if (!isValidVersion(NEW_VERSION)) {
		throw new Error(`Invalid version format: ${NEW_VERSION}`);
	}

	// Get all package directories
	const packageDirs = readdirSync(PACKAGES_DIR, { withFileTypes: true })
		.filter((dirent) => dirent.isDirectory())
		.map((dirent) => join(PACKAGES_DIR, dirent.name));

	// Update function for a single package.json
	function updatePackageVersion(packagePath: string) {
		const pkgJsonPath = join(packagePath, "package.json");

		try {
			const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));
			const oldVersion = pkg.version;

			// Update the package's own version
			pkg.version = NEW_VERSION;

			// Also update dependencies that are part of our monorepo
			for (const depType of [
				"dependencies",
				"peerDependencies",
				"devDependencies",
			]) {
				if (pkg[depType]) {
					Object.keys(pkg[depType]).forEach((dep) => {
						if (
							packageDirs.some((dir) =>
								dir.includes(dep.replace("@your-scope/", "")),
							)
						) {
							pkg[depType][dep] = NEW_VERSION;
						}
					});
				}
			}

			// Write the updated package.json
			writeFileSync(pkgJsonPath, `${JSON.stringify(pkg, null, 2)}\n`);
			console.log(
				`✅ Updated ${pkg.name} from ${oldVersion} to ${NEW_VERSION}`,
			);
		} catch (error) {
			console.error(`❌ Error updating ${packagePath}:`, error);
		}
	}

	// Update root package.json if it exists
	try {
		const rootPkg = JSON.parse(readFileSync("./package.json", "utf-8"));
		rootPkg.version = NEW_VERSION;
		writeFileSync("./package.json", `${JSON.stringify(rootPkg, null, 2)}\n`);
		console.log(`✅ Updated root package.json to ${NEW_VERSION}`);
	} catch (error) {
		console.log("ℹ️ No root package.json found or error updating it");
	}

	// Update all packages
	packageDirs.forEach(updatePackageVersion);

	console.log("\n🎉 Version update complete!");

	return NEW_VERSION;
}

// Allow running directly or importing
if (require.main === module) {
	const releaseType = process.argv[2] as
		| "major"
		| "minor"
		| "patch"
		| undefined;
	updateVersions(releaseType);
}
