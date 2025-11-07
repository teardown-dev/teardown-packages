import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

export const PACKAGES_DIR = "./packages";

export interface PackageJson {
	name: string;
	version: string;
	dependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	private?: boolean;
	scripts?: Record<string, string>;
	[key: string]: unknown;
}

// Helper to check if a string is a valid semver-like version
export const isValidVersion = (version: string) =>
	/^\d+\.\d+\.\d+(-[\w-]+)?$/.test(version);

// Helper to increment version based on release type
export function incrementVersion(
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

// Get all package directories
export function getPackageDirs(): string[] {
	return readdirSync(PACKAGES_DIR, { withFileTypes: true })
		.filter((dirent) => dirent.isDirectory())
		.map((dirent) => join(PACKAGES_DIR, dirent.name));
}

// Read package.json from a directory
export function readPackageJson(dir: string): PackageJson {
	return JSON.parse(readFileSync(join(dir, "package.json"), "utf-8"));
}

// Write package.json to a directory
export function writePackageJson(dir: string, pkg: PackageJson): void {
	writeFileSync(join(dir, "package.json"), `${JSON.stringify(pkg, null, 2)}\n`);
}

// Get root package.json
export function getRootPackageJson(): PackageJson {
	return readPackageJson(".");
}

// Git utilities
export const git = {
	commit: (message: string) => {
		execSync("git add .");
		execSync(`git commit -m "${message}"`, {
			stdio: "inherit",
		});
	},
	tag: (version: string, message: string) => {
		execSync(`git tag -a v${version} -m "${message}"`, {
			stdio: "inherit",
		});
	},
	push: (tags = false) => {
		// Get current branch name
		const currentBranch = execSync("git rev-parse --abbrev-ref HEAD")
			.toString()
			.trim();
		execSync(`git push origin ${currentBranch}${tags ? " --tags" : ""}`, {
			stdio: "inherit",
		});
	},
	reset: () => {
		execSync("git reset --hard", { stdio: "inherit" });
	},
};

// Version management
export function getCurrentVersion(): string {
	try {
		return getRootPackageJson().version;
	} catch (error) {
		return "0.0.0";
	}
}

// Package dependency types
export const DEP_TYPES = [
	"dependencies",
	"peerDependencies",
	"devDependencies",
] as const;

// New utility functions
export const npm = {
	publish: (packageDir: string) => {
		try {
			const pkg = readPackageJson(packageDir);

			try {
				// Try to check if version exists
				const versionCheck = execSync(
					`npm view ${pkg.name}@${pkg.version} version`,
					{ stdio: "pipe" },
				)
					.toString()
					.trim();

				if (versionCheck === pkg.version) {
					logSkip(
						`Version ${pkg.version} of ${pkg.name} already exists, skipping`,
					);
					return;
				}
			} catch (error) {
				// If package doesn't exist in registry, that's fine - we'll publish it
				if (error instanceof Error && !error.message.includes("E404")) {
					throw error;
				}
			}

			// Publish the package
			logStep(`Publishing ${pkg.name}@${pkg.version}...`);
			execSync(`cd ${packageDir} && npm publish --access public`, {
				stdio: "inherit",
			});
			logSuccess(`Published ${pkg.name}@${pkg.version}`);
		} catch (error) {
			// If error is not about existing version, rethrow
			if (
				error instanceof Error &&
				!error.message.includes("previously published versions") &&
				!error.message.includes("E404")
			) {
				throw error;
			}
			logError(`Failed to publish ${packageDir}`, error);
		}
	},
	build: (packageDir: string) => {
		try {
			execSync(`cd ${packageDir} && bun run build`, { stdio: "inherit" });
		} catch (error) {
			// If build fails, log but don't throw
			logError(`Build failed for ${packageDir}`, error);
		}
	},
};

export function getPackagePath(packageName: string): string {
	return `./packages/${packageName.replace("@teardown/", "")}`;
}

export function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function logStep(message: string): void {
	console.log(`\n📋 ${message}`);
}

export function logSuccess(message: string): void {
	console.log(`\n✅ ${message}`);
}

export function logSkip(message: string): void {
	console.log(`\n⏭️  ${message}`);
}

export function logError(message: string, error?: unknown): void {
	console.error(`\n❌ ${message}`, error || "");
}

// Add these functions from update-versions.ts
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
				logSuccess(`Replaced link dependencies in ${pkg.name}`);
			}
		} catch (error) {
			logError(`Error updating links in ${packagePath}:`, error);
		}
	});
}

export function updateVersions(
	releaseType?: "major" | "minor" | "patch",
): string {
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
		logSuccess(`Updated root package.json to ${NEW_VERSION}`);
	} catch (error) {
		logStep("No root package.json found or error updating it");
	}

	// Update all package versions
	getPackageDirs().forEach((packagePath) => {
		try {
			const pkg = readPackageJson(packagePath);
			const oldVersion = pkg.version;
			pkg.version = NEW_VERSION;
			writePackageJson(packagePath, pkg);
			logSuccess(`Updated ${pkg.name} from ${oldVersion} to ${NEW_VERSION}`);
		} catch (error) {
			logError(`Error updating ${packagePath}:`, error);
		}
	});

	logSuccess("Version update complete!");
	return NEW_VERSION;
}

type PackageInfo = {
	name: string;
	path: string;
	dependencies: string[];
	allDependencies: string[];
	peerDependencies: string[];
	devDependencies: string[];
};

export function getPublishOrder(): string[] {
	const packages = new Map<string, PackageInfo>();

	// First pass: collect all package info
	const packageDirs = getPackageDirs();

	packageDirs.forEach((packagePath) => {
		try {
			const pkgJson = readPackageJson(packagePath);

			// Collect dependencies by type
			const deps = Object.keys(pkgJson.dependencies || {});
			const peerDeps = Object.keys(pkgJson.peerDependencies || {});
			const devDeps = Object.keys(pkgJson.devDependencies || {});

			// Filter to only include our internal packages that exist
			const filterInternalDeps = (deps: string[]) =>
				deps.filter((dep) => {
					if (!dep.startsWith("@teardown/")) return false;
					const depPath = getPackagePath(dep);
					try {
						readPackageJson(depPath);
						return true;
					} catch {
						return false;
					}
				});

			const internalDeps = filterInternalDeps(deps);
			const internalPeerDeps = filterInternalDeps(peerDeps);
			const internalDevDeps = filterInternalDeps(devDeps);

			// Combine all internal dependencies for sorting
			const allInternalDeps = [
				...new Set([...internalDeps, ...internalPeerDeps, ...internalDevDeps]),
			];

			packages.set(pkgJson.name, {
				name: pkgJson.name,
				path: packagePath,
				dependencies: internalDeps,
				peerDependencies: internalPeerDeps,
				devDependencies: internalDevDeps,
				allDependencies: allInternalDeps,
			});
		} catch (error) {
			logError(`Error reading package at ${packagePath}`, error);
		}
	});

	// Topological sort considering all dependency types
	const sorted: string[] = [];
	const visited = new Set<string>();
	const temp = new Set<string>();

	function visit(pkgName: string) {
		if (temp.has(pkgName)) {
			throw new Error(`Circular dependency detected: ${pkgName}`);
		}
		if (visited.has(pkgName)) return;

		temp.add(pkgName);
		const pkg = packages.get(pkgName);
		if (pkg) {
			// Visit all dependencies first
			for (const dep of pkg.allDependencies) {
				if (packages.has(dep)) {
					visit(dep);
				}
			}
		}
		temp.delete(pkgName);
		visited.add(pkgName);
		sorted.unshift(pkgName);
	}

	// Visit all packages
	for (const pkgName of packages.keys()) {
		if (!visited.has(pkgName)) {
			visit(pkgName);
		}
	}

	return sorted.reverse();
}

export async function buildPackages() {
	try {
		const packages = getPublishOrder();
		logStep(`Building packages in order: ${packages.join(" -> ")}`);

		for (const packageName of packages) {
			const packageDir = getPackagePath(packageName);
			const pkg = readPackageJson(packageDir);

			if (pkg.scripts?.build) {
				logStep(`Building ${packageName}...`);
				npm.build(packageDir);
			}
		}

		logSuccess("All packages built successfully!");
	} catch (error) {
		logError("Build failed", error);
		process.exit(1);
	}
}
