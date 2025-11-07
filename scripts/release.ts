import { updateVersions, replaceLinkedDependencies } from "./update-versions";
import { execSync } from "node:child_process";

async function release() {
	try {
		// 1. Replace link: dependencies with actual versions
		console.log("\n🔗 Replacing linked dependencies...");
		replaceLinkedDependencies();

		// 2. Update versions
		console.log(`\n📦 Setting versions for @teardown packages in release...`);
		const newVersion = updateVersions();

		// 3. Git commit and tag
		console.log("\n🔨 Committing version updates...");
		execSync("git add .");

		execSync(`git commit -m "chore: release v${newVersion}"`, {
			stdio: "inherit",
		});
		execSync(`git tag v${newVersion}`, { stdio: "inherit" });

		// 4. Run publish script
		console.log("\n🚀 Publishing packages...");
		execSync("bun run publish-packages", { stdio: "inherit" });

		// 5. Push changes and tags
		console.log("\n📤 Pushing changes and tags...");
		execSync("git push origin main --tags", { stdio: "inherit" });

		console.log(`\n✨ Release v${newVersion} completed successfully!`);
	} catch (error) {
		console.error("\n❌ Release failed:", error);
		process.exit(1);
	}
}

release();
