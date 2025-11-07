import { execSync } from "node:child_process";
import { getPublishOrder } from "./get-package-order";
import { buildPackages } from "./build-packages";
import { replaceLinkedDependencies, updateVersions } from "./update-versions";

export async function publishPackages() {
	try {
		// 1. Build all packages first
		await buildPackages();

		// 2. Temporarily replace linked dependencies
		console.log("\n🔗 Replacing linked dependencies for publishing...");
		replaceLinkedDependencies();

		// 3. Publish packages in correct order
		const publishOrder = getPublishOrder();
		console.log(
			"\n📦 Publishing packages in order:",
			publishOrder.join(" -> "),
		);

		for (const packageName of publishOrder) {
			const packageDir = `./packages/${packageName.replace("@teardown/", "")}`;
			const pkg = require(`../${packageDir}/package.json`);

			if (pkg.private) {
				console.log(`\n⏭️  Skipping private package ${packageName}`);
				continue;
			}

			console.log(`\n🚀 Publishing ${packageName}...`);
			execSync(`cd ${packageDir} && npm publish --access public`, {
				stdio: "inherit",
			});

			// Small delay between publishes
			await new Promise((resolve) => setTimeout(resolve, 5000));
		}

		// 4. Revert temporary changes and bump patch version
		console.log("\n↩️  Reverting temporary dependency changes...");
		execSync("git reset --hard", { stdio: "inherit" });

		// 5. Bump to next patch version
		console.log("\n📈 Bumping to next patch version...");
		const nextVersion = updateVersions("patch");
		execSync("git add .");
		execSync(`git commit -m "chore: prepare next version ${nextVersion}"`, {
			stdio: "inherit",
		});
		execSync("git push", { stdio: "inherit" });

		console.log("\n✅ Publish complete!");
	} catch (error) {
		console.error("\n❌ Publish failed:", error);
		// Ensure we revert any temporary changes on failure
		execSync("git reset --hard", { stdio: "inherit" });
		process.exit(1);
	}
}

if (require.main === module) {
	publishPackages();
}
