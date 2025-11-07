import { execSync } from "node:child_process";
import { getPublishOrder } from "./get-package-order";

export async function buildPackages() {
	try {
		const packages = getPublishOrder();
		console.log("📦 Building packages in order:", packages.join(" -> "));

		for (const packageName of packages) {
			const packageDir = `./packages/${packageName.replace("@teardown/", "")}`;
			const pkg = require(`../${packageDir}/package.json`);

			if (pkg.scripts?.build) {
				console.log(`\n🔨 Building ${packageName}...`);
				execSync(`cd ${packageDir} && bun run build`, { stdio: "inherit" });
			}
		}

		console.log("\n✅ All packages built successfully!");
	} catch (error) {
		console.error("\n❌ Build failed:", error);
		process.exit(1);
	}
}

// Run if called directly
if (require.main === module) {
	buildPackages();
}
