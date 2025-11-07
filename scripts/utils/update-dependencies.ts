import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const PACKAGES_DIR = "./packages";
const SCOPE = "@teardown";

// Get all package directories
const packageDirs = readdirSync(PACKAGES_DIR, { withFileTypes: true })
	.filter((dirent) => dirent.isDirectory())
	.map((dirent) => join(PACKAGES_DIR, dirent.name));

// First, collect all package versions
const packageVersions = new Map<string, string>();

// Read all package versions first
packageDirs.forEach((packagePath) => {
	const pkgJsonPath = join(packagePath, "package.json");
	try {
		const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));
		if (pkg.name.startsWith(SCOPE)) {
			packageVersions.set(pkg.name, pkg.version);
		}
	} catch (error) {
		console.error(`❌ Error reading ${pkgJsonPath}:`, error);
	}
});

// Update function for a single package.json
function updatePackageDependencies(packagePath: string) {
	const pkgJsonPath = join(packagePath, "package.json");

	try {
		const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));
		let updated = false;

		// Helper function to update dependencies
		const updateDeps = (deps: Record<string, string> | undefined) => {
			if (!deps) return false;
			let hasUpdates = false;

			Object.keys(deps).forEach((dep) => {
				if (dep.startsWith(SCOPE)) {
					const latestVersion = packageVersions.get(dep);
					if (latestVersion && deps[dep] !== `^${latestVersion}`) {
						deps[dep] = `^${latestVersion}`;
						console.log(`  └─ ${dep}: ${deps[dep]}`);
						hasUpdates = true;
					}
				}
			});

			return hasUpdates;
		};

		console.log(`\n📦 Checking ${pkg.name}...`);

		// Update all dependency types
		updated = updateDeps(pkg.dependencies) || updated;
		updated = updateDeps(pkg.devDependencies) || updated;
		updated = updateDeps(pkg.peerDependencies) || updated;

		if (updated) {
			writeFileSync(pkgJsonPath, `${JSON.stringify(pkg, null, 2)}\n`);
			console.log(`✅ Updated dependencies in ${pkg.name}`);
		} else {
			console.log(`ℹ️ No updates needed for ${pkg.name}`);
		}
	} catch (error) {
		console.error(`❌ Error updating ${packagePath}:`, error);
	}
}

// Update root package.json if it exists
try {
	const rootPkg = JSON.parse(readFileSync("./package.json", "utf-8"));
	console.log("\n📦 Checking root package.json...");

	let updated = false;
	if (rootPkg.dependencies) {
		Object.keys(rootPkg.dependencies).forEach((dep) => {
			if (dep.startsWith(SCOPE)) {
				const latestVersion = packageVersions.get(dep);
				if (
					latestVersion &&
					rootPkg.dependencies[dep] !== `^${latestVersion}`
				) {
					rootPkg.dependencies[dep] = `^${latestVersion}`;
					console.log(`  └─ ${dep}: ${rootPkg.dependencies[dep]}`);
					updated = true;
				}
			}
		});
	}

	if (updated) {
		writeFileSync("./package.json", `${JSON.stringify(rootPkg, null, 2)}\n`);
		console.log("✅ Updated root package.json dependencies");
	} else {
		console.log("ℹ️ No updates needed for root package.json");
	}
} catch (error) {
	console.log("ℹ️ No root package.json found or error updating it");
}

// Update all packages
packageDirs.forEach(updatePackageDependencies);

console.log("\n🎉 Dependency update complete!");
