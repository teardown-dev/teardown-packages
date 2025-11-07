import { execSync } from "node:child_process";
import { updateVersions } from "./update-versions";

async function prepareRelease() {
	try {
		// Get release type from command line argument
		const releaseType = process.argv[2] as "major" | "minor" | "patch";
		if (!releaseType || !["major", "minor", "patch"].includes(releaseType)) {
			throw new Error("Please specify release type: major, minor, or patch");
		}

		// 1. Update versions across all packages
		console.log(`\n📦 Updating versions for ${releaseType} release...`);
		const newVersion = updateVersions(releaseType);

		// 2. Git commit the version updates
		console.log("\n🔨 Committing version updates...");
		execSync("git add .");
		execSync(`git commit -m "chore: prepare release v${newVersion}"`, {
			stdio: "inherit",
		});

		// 3. Push changes
		console.log("\n📤 Pushing changes...");
		execSync("git push origin main", { stdio: "inherit" });

		console.log(
			`\n✨ Version bump complete! Run 'bun run publish-release' when ready to publish.`,
		);
	} catch (error) {
		console.error("\n❌ Version bump failed:", error);
		process.exit(1);
	}
}

prepareRelease();
