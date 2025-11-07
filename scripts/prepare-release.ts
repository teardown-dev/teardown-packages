import { updateVersions } from "./update-versions";
import { git } from "./utils/package-utils";

async function prepareRelease() {
	try {
		const releaseType = process.argv[2] as "major" | "minor" | "patch";
		if (!releaseType || !["major", "minor", "patch"].includes(releaseType)) {
			throw new Error("Please specify release type: major, minor, or patch");
		}

		console.log(`\n📦 Updating versions for ${releaseType} release...`);
		const newVersion = updateVersions(releaseType);

		console.log("\n🔨 Committing version updates...");
		git.commit(`chore: prepare release v${newVersion}`);

		console.log("\n📤 Pushing changes...");
		git.push();

		console.log(
			`\n✨ Version bump complete! Run 'bun run publish-release' when ready to publish.`,
		);
	} catch (error) {
		console.error("\n❌ Version bump failed:", error);
		process.exit(1);
	}
}

prepareRelease();
