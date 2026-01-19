#!/usr/bin/env bun

import { existsSync } from "node:fs";
import { $ } from "bun";

const PROJECT_ID = "nfpppyxkwwvxxrguhtlz";
const GENERATED_TYPES_FILE = "./src/generated-types.ts";
const SCHEMAS = ["public"];
const REQUIRED_EXPORTS = ["Database", "TablesInsert", "TablesUpdate", "Enums", "Json"];

console.log("🔄 Generating TypeScript types from Supabase...");

// Store original file for rollback if needed
const originalContent = existsSync(GENERATED_TYPES_FILE) ? await Bun.file(GENERATED_TYPES_FILE).text() : "";

try {
	// Generate types using Supabase CLI (from remote project)
	const result = await $`supabase gen types typescript --project-id=${PROJECT_ID} --schema=${SCHEMAS.join(",")}`.text();

	// Validate output is not empty
	if (!result || result.trim().length === 0) {
		throw new Error("Supabase CLI returned empty output");
	}

	// Validate required exports exist
	const missingExports = REQUIRED_EXPORTS.filter((exportName) => !result.includes(`export type ${exportName}`));

	if (missingExports.length > 0) {
		throw new Error(`Generated types missing required exports: ${missingExports.join(", ")}`);
	}

	// Write the generated types
	await Bun.write(GENERATED_TYPES_FILE, result);

	console.log("✅ Types generated successfully");

	// Check if the generated file was modified
	const diffResult = await $`git diff --name-only ${GENERATED_TYPES_FILE}`.text();

	if (!diffResult.trim()) {
		console.log("ℹ️  No changes detected, exiting...");
		process.exit(0);
	}

	// Stage the changes
	await $`git add ${GENERATED_TYPES_FILE}`;

	// Check if there are staged changes before committing
	const stagedChanges = await $`git diff --cached --name-only`.text();
	if (stagedChanges.trim()) {
		const commitMessage = "👽️ update generated types from supabase";
		await $`git commit -m ${commitMessage}`;
		console.log("✅ Changes committed successfully");
	} else {
		console.log("ℹ️  No staged changes to commit");
	}
} catch (error) {
	console.error("❌ Failed to generate types:", error);

	// Rollback to original content if it existed
	if (originalContent) {
		console.log("🔄 Restoring original file...");
		await Bun.write(GENERATED_TYPES_FILE, originalContent);
		console.log("✅ Original file restored");
	}

	process.exit(1);
}
