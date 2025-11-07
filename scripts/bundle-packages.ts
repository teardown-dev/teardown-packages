import { $ } from "bun";

const DRY_RUN = process.argv.includes("--dry-run");

const PACKAGES = [
	{ name: "@teardown/react-native", path: "packages/react-native" },
] as const;

interface PackageJson {
	name: string;
	version: string;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
	[key: string]: unknown;
}

const PACKAGE_NAMES: string[] = PACKAGES.map((p) => p.name);

/** Replace workspace:* with actual version for publishing */
function resolveWorkspaceDeps(
	pkg: PackageJson,
	version: string,
): { pkg: PackageJson; hadWorkspace: boolean } {
	let hadWorkspace = false;
	const resolve = (deps: Record<string, string> | undefined) => {
		if (!deps) return deps;
		const resolved: Record<string, string> = {};
		for (const [name, value] of Object.entries(deps)) {
			if (PACKAGE_NAMES.includes(name) && value.startsWith("workspace:")) {
				resolved[name] = version;
				hadWorkspace = true;
			} else {
				resolved[name] = value;
			}
		}
		return resolved;
	};

	return {
		pkg: {
			...pkg,
			dependencies: resolve(pkg.dependencies),
			devDependencies: resolve(pkg.devDependencies),
			peerDependencies: resolve(pkg.peerDependencies),
		},
		hadWorkspace,
	};
}

/** Restore workspace:* after publishing */
function restoreWorkspaceDeps(pkg: PackageJson): PackageJson {
	const restore = (deps: Record<string, string> | undefined) => {
		if (!deps) return deps;
		const restored: Record<string, string> = {};
		for (const [name, value] of Object.entries(deps)) {
			if (PACKAGE_NAMES.includes(name) && !value.startsWith("workspace:")) {
				restored[name] = "workspace:*";
			} else {
				restored[name] = value;
			}
		}
		return restored;
	};

	return {
		...pkg,
		dependencies: restore(pkg.dependencies),
		devDependencies: restore(pkg.devDependencies),
		peerDependencies: restore(pkg.peerDependencies),
	};
}

function incrementPatch(version: string): string {
	const [major, minor, patch] = version.split(".").map(Number);
	return `${major}.${minor}.${(patch ?? 0) + 1}`;
}


function compareVersions(a: string, b: string): number {
	const [aMajor, aMinor, aPatch] = (a.split(".") as [string, string, string]).map(Number);
	const [bMajor, bMinor, bPatch] = (b.split(".") as [string, string, string]).map(Number);

	if (aMajor !== bMajor) return aMajor! - bMajor!;
	if (aMinor !== bMinor) return aMinor! - bMinor!;
	return aPatch! - bPatch!;
}

async function readPackageJson(path: string): Promise<PackageJson> {
	const file = Bun.file(`${path}/package.json`);
	return file.json();
}

async function writePackageJson(
	path: string,
	pkg: PackageJson,
): Promise<void> {
	const file = Bun.file(`${path}/package.json`);
	await Bun.write(file, `${JSON.stringify(pkg, null, "\t")}\n`);
}

async function main() {
	console.log(`📦 Bundle Packages${DRY_RUN ? " (dry run)" : ""}\n`);

	// 1. Read all versions
	console.log("1️⃣  Reading package versions...");
	const packages = await Promise.all(
		PACKAGES.map(async (pkg) => ({
			...pkg,
			json: await readPackageJson(pkg.path),
		})),
	);

	for (const pkg of packages) {
		console.log(`   ${pkg.name}: ${pkg.json.version}`);
	}

	// 2. Find highest version and increment
	const versions = packages.map((p) => p.json.version);
	const highest = versions.reduce((a, b) =>
		compareVersions(a, b) > 0 ? a : b,
	);
	const newVersion = incrementPatch(highest);

	console.log(`\n2️⃣  Bumping version: ${highest} → ${newVersion}`);

	// 3. Update all package.json files
	for (const pkg of packages) {
		pkg.json.version = newVersion;
		await writePackageJson(pkg.path, pkg.json);
		console.log(`   ✓ Updated ${pkg.name}`);
	}

	// Store original versions for dry run revert
	const originalVersions = packages.map((p) => ({
		path: p.path,
		version: highest,
	}));

	// 4. Publish each package sequentially (prepublish runs turbo build)
	console.log("\n3️⃣  Publishing packages...");
	const dryRunFlag = DRY_RUN ? ["--dry-run"] : [];
	const publishedPackages: string[] = [];
	for (const pkgDef of PACKAGES) {
		console.log(`   Publishing ${pkgDef.name}${DRY_RUN ? " (dry run)" : ""}...`);

		// Read current package.json and resolve workspace:* deps
		const currentPkg = await readPackageJson(pkgDef.path);
		const { pkg: resolvedPkg, hadWorkspace } = resolveWorkspaceDeps(currentPkg, newVersion);

		if (hadWorkspace) {
			await writePackageJson(pkgDef.path, resolvedPkg);
			console.log(`   → Resolved workspace deps to ${newVersion}`);
		}

		const result = await $`bun publish --cwd ${pkgDef.path} ${dryRunFlag}`.nothrow();

		// Restore workspace:* deps after publish
		if (hadWorkspace) {
			const restoredPkg = restoreWorkspaceDeps(resolvedPkg);
			await writePackageJson(pkgDef.path, restoredPkg);
			console.log(`   → Restored workspace deps`);
		}

		if (result.exitCode !== 0) {
			console.error(`❌ Failed to publish ${pkgDef.name}`);
		} else {
			publishedPackages.push(`${pkgDef.name}@${newVersion}`);
			console.log(`   ✓ ${DRY_RUN ? "Would publish" : "Published"} ${pkgDef.name}@${newVersion}`);
		}
	}

	// 5. Commit and tag (or revert for dry run)
	console.log("\n4️⃣  Committing and tagging...");
	const packageFiles = PACKAGES.map((p) => `${p.path}/package.json`);
	const commitMsg = `📦 npm release: v${newVersion}`;
	const tagName = `v${newVersion}`;

	if (DRY_RUN) {
		console.log(`   ⏭️ Would commit: ${commitMsg}`);
		console.log(`   ⏭️ Would tag: ${tagName}`);

		// Revert version changes
		console.log("\n5️⃣  Reverting version changes...");
		for (const { path } of originalVersions) {
			const pkg = await readPackageJson(path);
			pkg.version = highest;
			await writePackageJson(path, pkg);
		}
		console.log(`   ✓ Reverted all packages to ${highest}`);
	} else {
		await $`git add ${packageFiles}`;
		await $`git commit -m ${commitMsg}`;
		await $`git tag ${tagName}`;
		console.log(`   ✓ Committed: ${commitMsg}`);
		console.log(`   ✓ Tagged: ${tagName}`);
	}

	console.log(`\n✅ ${DRY_RUN ? "Dry run complete - publish skipped" : `All packages published at version ${newVersion}`}`);

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
}

main().catch((err) => {
	console.error("❌ Error:", err);
	process.exit(1);
});
