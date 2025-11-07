import { execSync } from "node:child_process";
import { replaceLinkedDependencies } from "./update-versions";
import { publishPackages } from "./publish-packages";
import { readFileSync } from "node:fs";

async function publishRelease() {
	try {
		// Get current version from package.json
		const { version } = JSON.parse(readFileSync("./package.json", "utf-8"));

		// 1. Replace all link: dependencies with actual versions
		console.log("\n🔗 Replacing linked dependencies...");
		replaceLinkedDependencies();

		// 2. Publish packages
		console.log("\n🚀 Publishing packages...");
		await publishPackages();

		// 3. Create and push release tag
		console.log("\n📌 Creating release tag...");
		execSync(`git tag -a v${version} -m "Release v${version}"`, {
			stdio: "inherit",
		});
		execSync("git push origin --tags", { stdio: "inherit" });

		// 4. Create a release commit
		console.log("\n📝 Creating release commit...");
		execSync("git add .");
		execSync(`git commit -m "chore: release v${version}"`, {
			stdio: "inherit",
		});
		execSync("git push origin main", { stdio: "inherit" });

		console.log("\n✨ Release published successfully!");
	} catch (error) {
		console.error("\n❌ Release publishing failed:", error);
		process.exit(1);
	}
}

publishRelease();
