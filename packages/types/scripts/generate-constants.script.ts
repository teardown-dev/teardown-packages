#!/usr/bin/env bun

import * as path from "node:path";
import { $ } from "bun";

const GENERATED_TYPES_PATH = path.join(import.meta.dir, "../src/generated-types.ts");
const OUTPUT_PATH = path.join(import.meta.dir, "../src/generated-consts.ts");

/**
 * Converts snake_case to PascalCase
 */
function toPascalCase(str: string): string {
	return str
		.split("_")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join("");
}

interface EnumDefinition {
	name: string;
	values: string[];
}

/**
 * Extracts enum names and values from Constants.public.Enums in generated-types.ts
 */
async function extractEnums(): Promise<EnumDefinition[]> {
	const content = await Bun.file(GENERATED_TYPES_PATH).text();

	// Find the entire Constants section
	const constantsMatch = content.match(/export const Constants = \{([\s\S]*?)\} as const/);
	if (!constantsMatch) {
		throw new Error("Could not find Constants export in generated-types.ts");
	}

	const constantsContent = constantsMatch[1];

	// Find public.Enums within Constants (not graphql_public.Enums)
	const publicEnumsMatch = constantsContent.match(/public:\s*\{\s*Enums:\s*\{([\s\S]*?)\n\s+\}/);
	if (!publicEnumsMatch) {
		throw new Error("Could not find public.Enums in Constants");
	}

	const enumsSection = publicEnumsMatch[1];
	const enums: EnumDefinition[] = [];

	// Match each enum definition: enum_name: ["VALUE1", "VALUE2", ...]
	const enumPattern = /(\w+):\s*\[([\s\S]*?)\]/g;

	for (const match of enumsSection.matchAll(enumPattern)) {
		const name = match[1];
		const valuesString = match[2];

		// Extract all quoted values from the array
		const values: string[] = [];
		const valueMatches = valuesString.matchAll(/"([^"]+)"/g);
		for (const valueMatch of valueMatches) {
			values.push(valueMatch[1]);
		}

		if (values.length > 0) {
			enums.push({ name, values });
		}
	}

	return enums;
}

/**
 * Generates TypeScript enum exports
 */
function generateConstantsFile(enums: EnumDefinition[]): string {
	const enumDeclarations = enums
		.map(({ name, values }) => {
			const pascalName = `${toPascalCase(name)}Enum`;
			const members = values.map((value) => `\t${value} = "${value}",`).join("\n");

			return `export enum ${pascalName} {\n${members}\n}`;
		})
		.join("\n\n");

	return `${enumDeclarations}
`;
}

try {
	console.log("🔍 Extracting enums from generated-types.ts...");
	const enums = await extractEnums();
	console.log(
		`✅ Found ${enums.length} enums:`,
		enums.map((e) => e.name)
	);

	console.log("📝 Generating enum declarations...");
	const content = generateConstantsFile(enums);

	console.log(`💾 Writing to ${OUTPUT_PATH}...`);
	await Bun.write(OUTPUT_PATH, content);

	console.log("✅ Generated constants file successfully");

	// Check if file was modified
	const diffResult = await $`git diff --name-only ${OUTPUT_PATH}`.text();

	if (!diffResult.trim()) {
		console.warn("No changes detected, exiting...");
		process.exit(0);
	}

	// Auto-commit changes
	console.log("📦 Committing changes...");
	await $`git add ${OUTPUT_PATH}`;

	// Check if there are staged changes before committing
	const stagedChanges = await $`git diff --cached --name-only`.text();
	if (stagedChanges.trim()) {
		const commitMessage = "🔧 chore: update generated constants";
		await $`git commit -m ${commitMessage}`;
		console.log("✅ Changes committed");
	} else {
		console.warn("No staged changes to commit, exiting...");
	}
} catch (error) {
	console.error("❌ Error generating constants:", error);
	process.exit(1);
}
