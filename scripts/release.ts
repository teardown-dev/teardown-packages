import { updateVersions } from "./update-versions";
import { execSync } from "node:child_process";

async function release() {
	try {
		// Get release type from command line argument
		const releaseType = process.argv[2] as "major" | "minor" | "patch";
		if (!releaseType || !["major", "minor", "patch"].includes(releaseType)) {
			throw new Error("Please specify release type: major, minor, or patch");
		}

		// 1. Update versions
		console.log(`\n📦 Updating versions for ${releaseType} release...`);
		const newVersion = updateVersions(releaseType);

		// 2. Git commit and tag
		console.log("\n🔨 Committing version updates...");
		execSync("git add .");
		execSync(`git commit -m "chore: release v${newVersion}"`, {
			stdio: "inherit",
		});
		execSync(`git tag v${newVersion}`, { stdio: "inherit" });

		// 3. Run publish script
		console.log("\n🚀 Publishing packages...");
		execSync("bun run ./scripts/publish-packages.ts", { stdio: "inherit" });

		// 4. Push changes and tags
		console.log("\n📤 Pushing changes and tags...");
		execSync("git push origin main --tags", { stdio: "inherit" });

		console.log(`\n✨ Release v${newVersion} completed successfully!`);
	} catch (error) {
		console.error("\n❌ Release failed:", error);
		process.exit(1);
	}
}

release();
