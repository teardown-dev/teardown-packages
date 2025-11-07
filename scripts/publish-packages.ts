import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { getPublishOrder } from "./get-package-order";

async function publishPackages() {
	try {
		const publishOrder = getPublishOrder();
		console.log("📦 Publishing packages in order:", publishOrder.join(" -> "));

		for (const packageName of publishOrder) {
			console.log(`\n🚀 Publishing ${packageName}...`);

			// Get package directory from name
			const packageDir = `./packages/${packageName.replace("@teardown/", "")}`;

			try {
				// Read package.json to check if private
				const pkgJson = JSON.parse(
					readFileSync(`${packageDir}/package.json`, "utf-8"),
				);

				if (pkgJson.private) {
					console.log(`⏭️  Skipping private package ${packageName}`);
					continue;
				}

				// Publish the package
				execSync(`cd ${packageDir} && npm publish --access public`, {
					stdio: "inherit",
				});

				// Wait a short time to ensure npm registry is updated
				await new Promise((resolve) => setTimeout(resolve, 5000));

				console.log(`✅ Successfully published ${packageName}`);
			} catch (error) {
				console.error(`❌ Failed to publish ${packageName}:`, error);
				throw error;
			}
		}

		console.log("\n✨ All packages published successfully!");
	} catch (error) {
		console.error("\n❌ Publishing failed:", error);
		process.exit(1);
	}
}

// Run if called directly
if (require.main === module) {
	publishPackages();
}

export { publishPackages };
