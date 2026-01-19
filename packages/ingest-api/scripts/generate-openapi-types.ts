#!/usr/bin/env bun
/**
 * Generate OpenAPI types from the Ingest API swagger endpoint.
 *
 * Usage:
 *   1. Start the ingest server: cd apps/ingest && bun run dev
 *   2. Run this script: bun run generate:types
 *
 * Alternatively, use a saved schema file:
 *   bun run generate:types --from-file ./openapi-schema.json
 */

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const generatedDir = join(__dirname, "../generated");
const schemaPath = join(generatedDir, "openapi-schema.json");
const typesPath = join(generatedDir, "openapi.d.ts");

const INGEST_SWAGGER_URL = "http://localhost:4501/swagger/json";

async function fetchSchema(): Promise<object | null> {
	try {
		const response = await fetch(INGEST_SWAGGER_URL);
		if (!response.ok) {
			console.error(`Failed to fetch schema: ${response.status} ${response.statusText}`);
			return null;
		}
		return response.json();
	} catch (error) {
		console.error("Failed to connect to ingest server:", error);
		return null;
	}
}

async function generateTypes() {
	// Ensure generated directory exists
	if (!existsSync(generatedDir)) {
		mkdirSync(generatedDir, { recursive: true });
	}

	const args = process.argv.slice(2);
	const fromFile = args.includes("--from-file");

	let schema: object | null = null;

	if (fromFile) {
		// Use existing schema file
		if (!existsSync(schemaPath)) {
			console.error(`Schema file not found: ${schemaPath}`);
			console.error("Run without --from-file to fetch from server");
			process.exit(1);
		}
		console.log("📄 Using saved schema file:", schemaPath);
		schema = JSON.parse(readFileSync(schemaPath, "utf-8"));
	} else {
		// Fetch from running server
		console.log("🔄 Fetching OpenAPI schema from:", INGEST_SWAGGER_URL);
		schema = await fetchSchema();

		if (!schema) {
			// Try to use cached schema
			if (existsSync(schemaPath)) {
				console.log("⚠️  Server not available, using cached schema");
				schema = JSON.parse(readFileSync(schemaPath, "utf-8"));
			} else {
				console.error("❌ No schema available. Start the ingest server first:");
				console.error("   cd apps/ingest && bun run dev");
				process.exit(1);
			}
		} else {
			// Save schema for offline use
			writeFileSync(schemaPath, JSON.stringify(schema, null, 2));
			console.log("✅ Schema saved to:", schemaPath);
		}
	}

	// Generate TypeScript types using openapi-typescript
	console.log("🔄 Generating TypeScript types...");

	try {
		execSync(`npx openapi-typescript ${schemaPath} -o ${typesPath}`, {
			stdio: "inherit",
			cwd: join(__dirname, ".."),
		});
		console.log("✅ Types generated:", typesPath);
	} catch (error) {
		console.error("❌ Failed to generate types:", error);
		process.exit(1);
	}
}

generateTypes();
