import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import semver from "semver";

export type VersionType = "patch" | "minor" | "major";

export function getRootPackageJson() {
	const packageJson = JSON.parse(readFileSync("package.json", "utf-8"));
	return packageJson;
}

export function execCommand(command: string) {
	try {
		return execSync(command, { stdio: "inherit" });
	} catch (error) {
		console.error(`Error executing command: ${command}`);
		throw error;
	}
}

export async function getNewVersion(versionType: VersionType): Promise<string> {
	const packageJson = getRootPackageJson();
	const currentVersion = packageJson.version;
	return semver.inc(currentVersion, versionType) || currentVersion;
}

export function gitCommand(commands: string[]) {
	for (const command of commands) {
		execCommand(`git ${command}`);
	}
}

export function createVersionTag(version: string) {
	gitCommand([
		`tag -a v${version} -m "Release v${version}"`,
		`push origin v${version}`,
	]);
}
