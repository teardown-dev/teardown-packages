#!/usr/bin/env bun

/**
 * Update @teardown/* package versions in the workspace catalog
 *
 * Usage:
 *   bun run scripts/update-catalog.ts          # Update to latest
 *   bun run scripts/update-catalog.ts 0.1.40   # Lock all to specific version
 */

interface PackageJson {
	workspaces: {
		packages: string[];
		catalogs: {
			teardown: Record<string, string>;
		};
	};
	[key: string]: unknown;
}

async function getLatestVersion(packageName: string): Promise<string> {
	console.log(`📦 Fetching latest version for ${packageName}...`);
	const result = await Bun.$`npm view ${packageName} version`.text();
	return result.trim();
}

async function main() {
	const targetVersion = Bun.argv[2];
	const packageJsonPath = `${import.meta.dir}/../package.json`;

	// Read package.json
	console.log("📖 Reading package.json...");
	const packageJson: PackageJson = await Bun.file(packageJsonPath).json();
	const catalog = packageJson.workspaces.catalogs.teardown;
	const packages = Object.keys(catalog);

	if (packages.length === 0) {
		console.log("❌ No packages found in catalog");
		process.exit(1);
	}

	// Determine target version
	let newVersion: string;
	if (targetVersion) {
		newVersion = targetVersion;
		console.log(`🔒 Using specified version: ${newVersion}`);
	} else {
		// Fetch latest from first package
		newVersion = await getLatestVersion(packages[0]);
		console.log(`✨ Latest version: ${newVersion}`);
	}

	// Update catalog
	console.log("\n📝 Updating catalog versions:");
	for (const pkg of packages) {
		const oldVersion = catalog[pkg];
		catalog[pkg] = newVersion;
		const status = oldVersion === newVersion ? "(unchanged)" : `${oldVersion} → ${newVersion}`;
		console.log(`   ${pkg}: ${status}`);
	}

	// Write package.json
	console.log("\n💾 Writing package.json...");
	await Bun.write(packageJsonPath, `${JSON.stringify(packageJson, null, "\t")}\n`);

	// Run bun install
	console.log("\n📥 Running bun install...");
	await Bun.$`bun install`;

	console.log("\n✅ Catalog updated successfully!");
}

main().catch((error) => {
	console.error("❌ Error:", error);
	process.exit(1);
});
