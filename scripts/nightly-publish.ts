import { $ } from "bun";

const PACKAGES = [
	{ name: "@teardown/react-native", path: "packages/react-native" },
] as const;

interface PackageJson {
	name: string;
	version: string;
	[key: string]: unknown;
}

function getNightlyVersion(baseVersion: string): string {
	const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
	// Strip any existing prerelease suffix to get base version
	const cleanVersion = baseVersion.split("-")[0];
	return `${cleanVersion}-nightly.${date}`;
}

async function readPackageJson(path: string): Promise<PackageJson> {
	const file = Bun.file(`${path}/package.json`);
	return file.json();
}

async function writePackageJson(path: string, pkg: PackageJson): Promise<void> {
	const file = Bun.file(`${path}/package.json`);
	await Bun.write(file, `${JSON.stringify(pkg, null, "\t")}\n`);
}

async function main() {
	console.log("🌙 Nightly Publish\n");

	// 1. Read all package versions
	console.log("1️⃣  Reading package versions...");
	const packages = await Promise.all(
		PACKAGES.map(async (pkg) => ({
			...pkg,
			json: await readPackageJson(pkg.path),
			originalVersion: "",
		})),
	);

	// Store original versions for restoration
	for (const pkg of packages) {
		pkg.originalVersion = pkg.json.version;
		console.log(`   ${pkg.name}: ${pkg.json.version}`);
	}

	// 2. Calculate nightly version (use highest base version)
	const versions = packages.map((p) => p.json.version.split("-")[0] ?? "0.0.0");
	const highest = versions.reduce((a, b) => {
		const [aMajor = 0, aMinor = 0, aPatch = 0] = a.split(".").map(Number);
		const [bMajor = 0, bMinor = 0, bPatch = 0] = b.split(".").map(Number);
		if (aMajor !== bMajor) return aMajor > bMajor ? a : b;
		if (aMinor !== bMinor) return aMinor > bMinor ? a : b;
		return aPatch >= bPatch ? a : b;
	});

	const nightlyVersion = getNightlyVersion(highest);
	console.log(`\n2️⃣  Nightly version: ${nightlyVersion}`);

	// 3. Update all package.json files with nightly version
	for (const pkg of packages) {
		pkg.json.version = nightlyVersion;
		await writePackageJson(pkg.path, pkg.json);
		console.log(`   ✓ Updated ${pkg.name}`);
	}

	// 4. Publish each package with --tag nightly
	// bun publish automatically resolves workspace:* deps
	console.log("\n3️⃣  Publishing packages...");
	const publishedPackages: string[] = [];

	for (const pkgDef of packages) {
		console.log(`   Publishing ${pkgDef.name}...`);

		const result =
			await $`bun publish --cwd ${pkgDef.path} --tag nightly`.nothrow();

		if (result.exitCode !== 0) {
			console.error(`❌ Failed to publish ${pkgDef.name}`);
		} else {
			publishedPackages.push(`${pkgDef.name}@${nightlyVersion}`);
			console.log(`   ✓ Published ${pkgDef.name}@${nightlyVersion}`);
		}
	}

	// 5. Restore original versions (nightly versions shouldn't be committed)
	console.log("\n4️⃣  Restoring original versions...");
	for (const pkg of packages) {
		pkg.json.version = pkg.originalVersion;
		await writePackageJson(pkg.path, pkg.json);
		console.log(`   ✓ Restored ${pkg.name} to ${pkg.originalVersion}`);
	}

	// Summary
	console.log("\n📋 Published Packages Summary:");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	if (publishedPackages.length === 0) {
		console.log("   No packages were published");
	} else {
		for (const pkg of publishedPackages) {
			console.log(`   ✓ ${pkg}`);
		}
	}
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log("\n✅ Nightly publish complete");
}

main().catch((err) => {
	console.error("❌ Error:", err);
	process.exit(1);
});
