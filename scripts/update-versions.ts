import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Get the new version from environment variable or use default
const NEW_VERSION = process.env.VERSION || "0.0.0-dev";
const PACKAGES_DIR = "./packages";

// Helper to check if a string is a valid semver-like version
const isValidVersion = (version: string) =>
	/^\d+\.\d+\.\d+(-[\w-]+)?$/.test(version);

if (!isValidVersion(NEW_VERSION)) {
	console.error(`Invalid version format: ${NEW_VERSION}`);
	process.exit(1);
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

		// Update dependencies that are part of the monorepo
		if (pkg.dependencies) {
			Object.keys(pkg.dependencies).forEach((dep) => {
				if (dep.startsWith("@teardown/")) {
					pkg.dependencies[dep] = `^${NEW_VERSION}`;
				}
			});
		}

		// Update devDependencies that are part of the monorepo
		if (pkg.devDependencies) {
			Object.keys(pkg.devDependencies).forEach((dep) => {
				if (dep.startsWith("@teardown/")) {
					pkg.devDependencies[dep] = `^${NEW_VERSION}`;
				}
			});
		}

		// Update peerDependencies that are part of the monorepo
		if (pkg.peerDependencies) {
			Object.keys(pkg.peerDependencies).forEach((dep) => {
				if (dep.startsWith("@teardown/")) {
					pkg.peerDependencies[dep] = `^${NEW_VERSION}`;
				}
			});
		}

		// Write the updated package.json
		writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2) + "\n");
		console.log(`✅ Updated ${pkg.name} from ${oldVersion} to ${NEW_VERSION}`);
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
