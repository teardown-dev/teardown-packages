import {
	getPackageDirs,
	readPackageJson,
	writePackageJson,
	getRootPackageJson,
	isValidVersion,
	incrementVersion,
	DEP_TYPES,
	getCurrentVersion,
} from "./package-utils";

// Function to replace link: dependencies with actual versions
export function replaceLinkedDependencies() {
	const currentVersion = getCurrentVersion();
	const packageDirs = getPackageDirs();

	packageDirs.forEach((packagePath) => {
		try {
			const pkg = readPackageJson(packagePath);
			let hasChanges = false;

			for (const depType of DEP_TYPES) {
				if (pkg[depType]) {
					Object.entries(pkg[depType]).forEach(([dep, version]) => {
						if (typeof version === "string" && version.startsWith("link:")) {
							if (pkg[depType]) {
								pkg[depType][dep] = currentVersion;
								hasChanges = true;
							}
						}
					});
				}
			}

			if (hasChanges) {
				writePackageJson(packagePath, pkg);
				console.log(`🔗 Replaced link dependencies in ${pkg.name}`);
			}
		} catch (error) {
			console.error(`❌ Error updating links in ${packagePath}:`, error);
		}
	});
}

// Function to update versions across all packages
export function updateVersions(releaseType?: "major" | "minor" | "patch") {
	const NEW_VERSION = releaseType
		? incrementVersion(getCurrentVersion(), releaseType)
		: process.env.VERSION || getCurrentVersion();

	if (!isValidVersion(NEW_VERSION)) {
		throw new Error(`Invalid version format: ${NEW_VERSION}`);
	}

	// Update root package.json
	try {
		const rootPkg = getRootPackageJson();
		rootPkg.version = NEW_VERSION;
		writePackageJson(".", rootPkg);
		console.log(`✅ Updated root package.json to ${NEW_VERSION}`);
	} catch (error) {
		console.log("ℹ️ No root package.json found or error updating it");
	}

	// Update all package versions
	getPackageDirs().forEach((packagePath) => {
		try {
			const pkg = readPackageJson(packagePath);
			const oldVersion = pkg.version;
			pkg.version = NEW_VERSION;
			writePackageJson(packagePath, pkg);
			console.log(
				`✅ Updated ${pkg.name} from ${oldVersion} to ${NEW_VERSION}`,
			);
		} catch (error) {
			console.error(`❌ Error updating ${packagePath}:`, error);
		}
	});

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

	replaceLinkedDependencies();
	updateVersions(releaseType);
}
