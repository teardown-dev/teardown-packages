import {
	updateVersions,
	git,
	logStep,
	logSuccess,
	logError,
} from "./utils/package-utils";

async function prepareRelease() {
	try {
		logStep("Starting prepare-release script...");

		const releaseType = process.argv[2] as "major" | "minor" | "patch";
		logStep(`Release type: ${releaseType}`);

		if (!releaseType || !["major", "minor", "patch"].includes(releaseType)) {
			throw new Error("Please specify release type: major, minor, or patch");
		}

		logStep("Updating versions...");
		const newVersion = updateVersions(releaseType);
		logStep(`New version calculated: ${newVersion}`);

		logStep("Committing changes...");
		git.commit(`chore: prepare release v${newVersion}`);

		logStep("Pushing changes...");
		git.push();

		logSuccess(`Version bumped to ${newVersion}`);
		console.log(`Run 'bun run publish-packages' when ready to publish`);
	} catch (error) {
		logError("Version bump failed", error);
		process.exit(1);
	}
}

if (require.main === module) {
	logStep("Script started");
	prepareRelease().catch((error) => {
		logError("Unhandled error", error);
		process.exit(1);
	});
}
