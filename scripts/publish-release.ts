import { execSync } from "node:child_process";
import { replaceLinkedDependencies } from "./update-versions";
import { publishPackages } from "./publish-packages";

async function publishRelease() {
	try {
		// 1. Replace all link: dependencies with actual versions
		console.log("\n🔗 Replacing linked dependencies...");
		replaceLinkedDependencies();

		// 2. Publish packages
		console.log("\n🚀 Publishing packages...");
		await publishPackages();

		console.log("\n✨ Release published successfully!");
	} catch (error) {
		console.error("\n❌ Release publishing failed:", error);
		process.exit(1);
	}
}

publishRelease();
