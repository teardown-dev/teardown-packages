import { updateVersions } from "./update-versions";
import { git } from "./utils/package-utils";

async function prepareRelease() {
	try {
		console.log("Starting prepare-release script...");

		const releaseType = process.argv[2] as "major" | "minor" | "patch";
		console.log("Release type:", releaseType);

		if (!releaseType || !["major", "minor", "patch"].includes(releaseType)) {
			throw new Error("Please specify release type: major, minor, or patch");
		}

		console.log("Updating versions...");
		const newVersion = updateVersions(releaseType);
		console.log("New version calculated:", newVersion);

		console.log("Committing changes...");
		git.commit(`chore: prepare release v${newVersion}`);

		console.log("Pushing changes...");
		git.push();

		console.log(`\n✅ Version bumped to ${newVersion}`);
		console.log(`Run 'bun run publish-packages' when ready to publish`);
	} catch (error) {
		console.error("\n❌ Version bump failed:", error);
		process.exit(1);
	}
}

if (require.main === module) {
	console.log("Script started");
	prepareRelease().catch((error) => {
		console.error("Unhandled error:", error);
		process.exit(1);
	});
}
