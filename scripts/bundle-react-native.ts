import { $ } from "bun";

const DRY_RUN = process.argv.includes("--dry-run");

const PACKAGE = { name: "@teardown/react-native", path: "packages/react-native" };

// Internal workspace packages that need version resolution
const WORKSPACE_PACKAGES = [
	"@teardown/tsconfig",
	"@teardown/errors",
	"@teardown/types",
	"@teardown/schemas",
	"@teardown/ingest-api",
];

interface PackageJson {
	name: string;
	version: string;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
	[key: string]: unknown;
}

/** Replace workspace:* and catalog:* with actual published versions */
async function resolveWorkspaceDeps(
	pkg: PackageJson,
): Promise<{ pkg: PackageJson; hadWorkspace: boolean }> {
	let hadWorkspace = false;

	const resolve = async (deps: Record<string, string> | undefined) => {
		if (!deps) return deps;
		const resolved: Record<string, string> = {};
		for (const [name, value] of Object.entries(deps)) {
			if (WORKSPACE_PACKAGES.includes(name) && (value.startsWith("workspace:") || value.startsWith("catalog:"))) {
				// Get latest published version from npm
				const result = await $`npm view ${name} version`.quiet().nothrow();
				if (result.exitCode === 0) {
					const version = result.stdout.toString().trim();
					resolved[name] = version;
					hadWorkspace = true;
					console.log(`   → Resolved ${name}: ${value} → ${version}`);
				} else {
					console.warn(`   ⚠️  Could not resolve ${name}, keeping ${value}`);
					resolved[name] = value;
				}
			} else {
				resolved[name] = value;
			}
		}
		return resolved;
	};

	return {
		pkg: {
			...pkg,
			dependencies: await resolve(pkg.dependencies),
			devDependencies: await resolve(pkg.devDependencies),
			peerDependencies: await resolve(pkg.peerDependencies),
		},
		hadWorkspace,
	};
}

/** Restore workspace:* and catalog:* after publishing */
function restoreWorkspaceDeps(pkg: PackageJson, original: PackageJson): PackageJson {
	return {
		...pkg,
		dependencies: original.dependencies,
		devDependencies: original.devDependencies,
		peerDependencies: original.peerDependencies,
	};
}

function incrementPatch(version: string): string {
	const [major, minor, patch] = version.split(".").map(Number);
	return `${major}.${minor}.${(patch ?? 0) + 1}`;
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
	console.log(`📦 Publish ${PACKAGE.name}${DRY_RUN ? " (dry run)" : ""}\n`);

	// 1. Read current version
	console.log("1️⃣  Reading package version...");
	const originalPkg = await readPackageJson(PACKAGE.path);
	const currentVersion = originalPkg.version;
	const newVersion = incrementPatch(currentVersion);
	console.log(`   ${PACKAGE.name}: ${currentVersion}`);

	// 2. Bump version
	console.log(`\n2️⃣  Bumping version: ${currentVersion} → ${newVersion}`);
	const updatedPkg = { ...originalPkg, version: newVersion };
	await writePackageJson(PACKAGE.path, updatedPkg);
	console.log(`   ✓ Updated ${PACKAGE.name}`);

	// 3. Resolve workspace deps
	console.log("\n3️⃣  Resolving workspace dependencies...");
	const { pkg: resolvedPkg, hadWorkspace } = await resolveWorkspaceDeps(updatedPkg);
	if (hadWorkspace) {
		await writePackageJson(PACKAGE.path, resolvedPkg);
	} else {
		console.log("   No workspace dependencies to resolve");
	}

	// 4. Publish
	console.log(`\n4️⃣  Publishing${DRY_RUN ? " (dry run)" : ""}...`);
	const dryRunFlag = DRY_RUN ? ["--dry-run"] : [];
	const result = await $`bun publish --cwd ${PACKAGE.path} ${dryRunFlag}`.nothrow();

	// 5. Restore original deps
	if (hadWorkspace) {
		console.log("\n5️⃣  Restoring workspace dependencies...");
		const restoredPkg = restoreWorkspaceDeps(resolvedPkg, originalPkg);
		restoredPkg.version = newVersion; // Keep new version
		await writePackageJson(PACKAGE.path, restoredPkg);
		console.log("   ✓ Restored workspace deps");
	}

	if (result.exitCode !== 0) {
		console.error(`\n❌ Failed to publish ${PACKAGE.name}`);

		// Revert version on failure
		if (DRY_RUN) {
			console.log("\n6️⃣  Reverting version (dry run)...");
			await writePackageJson(PACKAGE.path, originalPkg);
			console.log(`   ✓ Reverted to ${currentVersion}`);
		}
		process.exit(1);
	}

	// 6. Commit and tag (or revert for dry run)
	console.log("\n6️⃣  Committing and tagging...");
	const packageFile = `${PACKAGE.path}/package.json`;
	const commitMsg = `📦 npm release: ${PACKAGE.name}@${newVersion}`;
	const tagName = `@teardown/react-native@${newVersion}`;

	if (DRY_RUN) {
		console.log(`   ⏭️ Would commit: ${commitMsg}`);
		console.log(`   ⏭️ Would tag: ${tagName}`);

		// Revert version changes
		console.log("\n7️⃣  Reverting version changes (dry run)...");
		await writePackageJson(PACKAGE.path, originalPkg);
		console.log(`   ✓ Reverted to ${currentVersion}`);
	} else {
		await $`git add ${packageFile}`;
		await $`git commit -m ${commitMsg}`;
		await $`git tag ${tagName}`;
		console.log(`   ✓ Committed: ${commitMsg}`);
		console.log(`   ✓ Tagged: ${tagName}`);
	}

	console.log(`\n✅ ${DRY_RUN ? "Dry run complete" : `Published ${PACKAGE.name}@${newVersion}`}`);
}

main().catch((err) => {
	console.error("❌ Error:", err);
	process.exit(1);
});
