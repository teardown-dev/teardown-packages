#!/usr/bin/env bun
import { $ } from "bun";
import { join } from "node:path";
import {
	logStep,
	logSuccess,
	logError,
	getPublishOrder,
	readPackageJson,
	replaceLinkedDependencies,
} from "./utils/package-utils";

async function isPackagePublished(
	packageName: string,
	version: string,
): Promise<boolean> {
	try {
		const result = await $`npm view ${packageName}@${version} version`.text();
		return result.trim() === version;
	} catch {
		return false;
	}
}

async function publishPackage(packagePath: string) {
	const pkg = readPackageJson(packagePath);

	if (await isPackagePublished(pkg.name, pkg.version)) {
		logStep(
			`Package ${pkg.name}@${pkg.version} is already published, skipping...`,
		);
		return;
	}

	logStep(`Publishing ${pkg.name}@${pkg.version}...`);
	await $`cd ${packagePath} && npm publish --access public`;
}

export async function publishPackages() {
	try {
		logStep("Replacing linked dependencies...");
		replaceLinkedDependencies();

		logStep("Building packages...");
		await $`bun run build-packages`;

		const orderedPackages = getPublishOrder();
		logStep(`Publishing packages in order: ${orderedPackages.join(" -> ")}`);

		for (const packagePath of orderedPackages) {
			await publishPackage(packagePath);
		}

		logSuccess("All packages published successfully!");
	} catch (error) {
		logError("Package publishing failed", error);
		process.exit(1);
	}
}

if (require.main === module) {
	publishPackages().catch((error) => {
		logError("Unhandled error", error);
		process.exit(1);
	});
}
