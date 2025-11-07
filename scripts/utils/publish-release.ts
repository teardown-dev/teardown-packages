import {
	logError,
	replaceLinkedDependencies,
	updateVersions,
} from "./package-utils";
import { publishPackages } from "./publish-packages";
import { getCurrentVersion, git } from "./package-utils";

async function publishRelease() {
	try {
		const version = getCurrentVersion();

		console.log("\n🔗 Replacing linked dependencies...");
		replaceLinkedDependencies();

		console.log("\n🚀 Publishing packages...");
		await publishPackages();

		console.log("\n📌 Creating release tag...");
		git.tag(version, `Release v${version}`);
		git.push(true);

		console.log("\n📝 Creating release commit...");
		git.commit(`chore: release v${version}`);
		git.push();

		console.log("\n📈 Incrementing to next patch version...");
		const nextVersion = updateVersions("patch");

		console.log("\n📝 Committing next version...");
		git.commit(`chore: prepare next version v${nextVersion}`);
		git.push();

		console.log(
			`\n✨ Release published successfully and bumped to v${nextVersion}!`,
		);
	} catch (error) {
		console.error("\n❌ Release publishing failed:", error);
		process.exit(1);
	}
}
