import {
	logError,
	logStep,
	logSuccess,
	replaceLinkedDependencies,
} from "./utils/package-utils";

async function packagesPrepublish() {
	logStep("🔗 Starting link dependency replacement...");

	try {
		await replaceLinkedDependencies();
		logSuccess("🎉 Successfully replaced all link dependencies!");
	} catch (error) {
		logError("Failed to replace link dependencies", error);
		process.exit(1);
	}
}

if (require.main === module) {
	packagesPrepublish().catch((error) => {
		logError("Unhandled error", error);
		process.exit(1);
	});
}
