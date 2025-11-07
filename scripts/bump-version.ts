#!/usr/bin/env bun
import {
	getNewVersion,
	gitCommands,
	updateVersions,
	logStep,
	logSuccess,
	logError,
} from "./utils/package-utils";
import type { VersionType } from "./utils/package-utils";

const versionType = process.argv[2] as VersionType;

if (!["patch", "minor", "major"].includes(versionType)) {
	logError("Version type must be one of: patch, minor, major");
	process.exit(1);
}

async function bumpVersion() {
	try {
		logStep("Starting version bump...");
		const newVersion = await getNewVersion(versionType);

		logStep(`Updating versions to ${newVersion}...`);
		updateVersions(versionType);

		logStep("Committing changes...");
		gitCommands([
			"add .",
			`commit -m "chore: bump version to ${newVersion}"`,
			"push origin main",
		]);

		logSuccess(`Version bumped to ${newVersion}`);
	} catch (error) {
		logError("Version bump failed", error);
		process.exit(1);
	}
}
