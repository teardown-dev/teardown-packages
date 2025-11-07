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
		execSync(`git commit -m "${message}"`, { stdio: "inherit" });
	},
	tag: (version: string, message: string) => {
		execSync(`git tag -a v${version} -m "${message}"`, { stdio: "inherit" });
	},
	push: (tags = false) => {
		execSync(`git push origin main${tags ? " --tags" : ""}`, {
			stdio: "inherit",
		});
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
