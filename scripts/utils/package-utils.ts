import { execSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

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

export type VersionType = "patch" | "minor" | "major";

export const DEP_TYPES = [
	"dependencies",
	"devDependencies",
	"peerDependencies",
] as const;

export const PACKAGES_DIR = "./packages";

export function getPackagePath(packageName: string): string {
	return `./packages/${packageName.replace("@teardown/", "")}`;
}

export function readPackageJson(packagePath: string): PackageJson {
	return JSON.parse(readFileSync(join(packagePath, "package.json"), "utf-8"));
}

export function getRootPackageJson(): PackageJson {
	return readPackageJson(".");
}

export function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Add color utility object
const clogger = {
	wrap: (code: number, text: string) => `\x1b[${code}m${text}\x1b[0m`,
	blue: (text: string) => clogger.wrap(34, text),
	green: (text: string) => clogger.wrap(32, text),
	red: (text: string) => clogger.wrap(31, text),
} as const;

export function logSkip(message: string): void {
	console.log(`\n⏭️  ${message}`);
}

export function logStep(message: string) {
	console.log(clogger.blue("\n🔄"), message);
}

export function logSuccess(message: string) {
	console.log(clogger.green("\n✅"), message);
}

export function logError(message: string, error?: unknown) {
	console.error(clogger.red("\n❌"), message);
	if (error) console.error(error);
}

export function writePackageJson(packagePath: string, pkg: PackageJson) {
	writeFileSync(
		join(packagePath, "package.json"),
		`${JSON.stringify(pkg, null, 2)}\n`,
	);
}

export function getCurrentVersion(): string {
	return getRootPackageJson().version;
}

// Add version utilities
const version = {
	parse: (v: string) => {
		const match = v.match(
			/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-.]+))?(?:\+([0-9A-Za-z-]+))?$/,
		);
		if (!match) return null;

		const [, major, minor, patch, prerelease] = match;
		return {
			major: Number.parseInt(major),
			minor: Number.parseInt(minor),
			patch: Number.parseInt(patch),
			prerelease: prerelease || "",
		};
	},

	valid: (v: string): boolean => {
		return version.parse(v) !== null;
	},

	inc: (v: string, release: VersionType): string | null => {
		const parsed = version.parse(v);
		if (!parsed) return null;

		const { major, minor, patch } = parsed;
		switch (release) {
			case "major":
				return `${major + 1}.0.0`;
			case "minor":
				return `${major}.${minor + 1}.0`;
			case "patch":
				return `${major}.${minor}.${patch + 1}`;
		}
	},
} as const;

export async function getNewVersion(versionType: VersionType): Promise<string> {
	const currentVersion = getCurrentVersion();
	return version.inc(currentVersion, versionType) || currentVersion;
}

export function isValidVersion(v: string): boolean {
	return version.valid(v);
}

export function getPackageDirs(): string[] {
	try {
		return readdirSync(PACKAGES_DIR, { withFileTypes: true })
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => `${PACKAGES_DIR}/${dirent.name}`);
	} catch (error) {
		// If packages directory doesn't exist, return empty array
		return [];
	}
}

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

// Git utilities
export const git = {
	addAll: () => {
		execSync("git add .");
	},
	commit: (message: string) => {
		execSync("git add .");
		execSync(`git commit -m "${message}"`, {
			stdio: "inherit",
		});
	},
	tag: (version: string, message: string) => {
		execSync(`git tag -a release/packages/${version} -m "${message}"`, {
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
	createBranch: (branchName: string, force = false) => {
		try {
			if (force) {
				// Try to delete remote branch first
				try {
					execSync(`git push origin --delete ${branchName}`, {
						stdio: "inherit",
					});
				} catch {
					// Ignore error if branch doesn't exist remotely
				}
				// Try to delete local branch
				try {
					execSync(`git branch -D ${branchName}`, { stdio: "inherit" });
				} catch {
					// Ignore error if branch doesn't exist locally
				}
			}

			// Create and checkout new branch
			execSync(`git checkout -b ${branchName}`, { stdio: "inherit" });
			// Push to remote with force if needed
			execSync(`git push ${force ? "-f" : ""} origin ${branchName}`, {
				stdio: "inherit",
			});

			logSuccess(`Branch ${branchName} ${force ? "re" : ""}created and pushed`);
		} catch (error) {
			logError(`Failed to create branch ${branchName}`, error);
			throw error;
		}
	},
};

export const npm = {
	publish: (packageDir: string, dryRun = false) => {
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
			logStep(
				`${dryRun ? "[DRY RUN] Would publish" : "Publishing"} ${pkg.name}@${pkg.version}...`,
			);

			if (!dryRun) {
				execSync(`cd ${packageDir} && npm publish --access public`, {
					stdio: "inherit",
				});
				logSuccess(`Published ${pkg.name}@${pkg.version}`);
			} else {
				logSuccess(`[DRY RUN] Would have published ${pkg.name}@${pkg.version}`);
			}
		} catch (error) {
			// If error is not about existing version, rethrow
			if (
				error instanceof Error &&
				!error.message.includes("previously published versions") &&
				!error.message.includes("E404")
			) {
				throw error;
			}
			logError(
				`Failed to ${dryRun ? "dry run " : ""}publish ${packageDir}`,
				error,
			);
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

// Add these functions from update-versions.ts
export async function replaceLinkedDependencies() {
	const currentVersion = getCurrentVersion();
	const packageDirs = getPackageDirs();

	for (const packagePath of packageDirs) {
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
				await Promise.resolve(writePackageJson(packagePath, pkg));
				logSuccess(`Replaced link dependencies in ${pkg.name}`);
			}
		} catch (error) {
			logError(`Error updating links in ${packagePath}:`, error);
		}
	}
}

export async function synchronizePackageVersions(
	newVersion: string,
	dryRun = false,
): Promise<string> {
	logStep(`Synchronizing package versions to ${newVersion}`);

	if (!version.valid(newVersion)) {
		throw new Error(`Invalid version format: ${newVersion}`);
	}

	// Update root package.json
	try {
		const rootPkg = getRootPackageJson();
		const oldRootVersion = rootPkg.version;

		if (dryRun) {
			logStep(
				`[DRY RUN] Would update root package.json from ${oldRootVersion} to ${newVersion}`,
			);
		} else {
			rootPkg.version = newVersion;
			writePackageJson(".", rootPkg);
			logSuccess(
				`Updated root package.json from ${oldRootVersion} to ${newVersion}`,
			);
		}
	} catch (error) {
		logStep("No root package.json found or error updating it");
	}

	// Update all package versions
	const packageDirs = getPackageDirs();
	for (const packagePath of packageDirs) {
		try {
			const pkg = readPackageJson(packagePath);
			const oldVersion = pkg.version;

			if (dryRun) {
				logStep(
					`[DRY RUN] Would update ${pkg.name} from ${oldVersion} to ${newVersion}`,
				);
			} else {
				pkg.version = newVersion;
				writePackageJson(packagePath, pkg);
				logSuccess(`Updated ${pkg.name} from ${oldVersion} to ${newVersion}`);
			}
		} catch (error) {
			logError(
				`Error ${dryRun ? "checking" : "updating"} ${packagePath}:`,
				error,
			);
		}
	}

	if (dryRun) {
		logSuccess("[DRY RUN] Version update simulation complete!");
	} else {
		logSuccess("Version update complete!");
	}

	return newVersion;
}

type PackageInfo = {
	name: string;
	path: string;
	dependencies: string[];
	allDependencies: string[];
	peerDependencies: string[];
	devDependencies: string[];
};

export function execCommand(command: string) {
	try {
		return execSync(command, { stdio: "inherit" });
	} catch (error) {
		console.error(`Error executing command: ${command}`);
		throw error;
	}
}
