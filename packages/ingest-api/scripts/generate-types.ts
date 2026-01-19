#!/usr/bin/env bun
/**
 * Generate standalone route types from ingest app build output.
 * Produces types without Elysia dependency for client packages.
 */

import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use main monorepo ingest app since conductor workspace may not have built types
const ingestAppPath = join(__dirname, "../../../apps/ingest");
const generatedDir = join(__dirname, "../generated");
const appDtsPath = join(generatedDir, "app.d.ts");
const routesPath = join(generatedDir, "routes.ts");
const sourceDeclarationPath = join(ingestAppPath, "dist/src/app.d.ts");

async function generateTypes() {
	try {
		// Ensure generated directory exists
		await mkdir(generatedDir, { recursive: true });

		// Try to copy the declaration file from ingest app build output
		// This is optional - routes.ts is the primary output
		try {
			await copyFile(sourceDeclarationPath, appDtsPath);
			console.log("✅ app.d.ts copied:", appDtsPath);
		} catch {
			console.log("⚠️  app.d.ts not found (build ingest app first if needed)");
		}

		// Generate standalone route types
		await generateRouteTypes();
		console.log("✅ routes.ts generated:", routesPath);
	} catch (error) {
		console.error("❌ Error generating types:", error);
		if (error instanceof Error) {
			console.error("Error details:", error.message);
		}
		process.exit(1);
	}
}

async function generateRouteTypes() {
	// Generate standalone route types without Elysia imports
	// These types match the structure expected by our typed fetch client
	const routeTypes = `/**
 * Auto-generated route types for Ingest API.
 * DO NOT EDIT - regenerate with: bun run generate:types
 */

import type { DevicePlatformEnum } from "@teardown/types";
import type { NotificationPlatformEnum, IdentifyVersionStatusEnum } from "@teardown/schemas";
import type { ErrorResponse } from "@teardown/errors";

/** HTTP methods supported by the API */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

/** Base route definition */
export interface RouteDefinition {
	body?: unknown;
	params?: Record<string, string>;
	query?: unknown;
	headers?: Record<string, string | undefined>;
	response: Record<number, unknown>;
}

/** Validation error response */
export interface ValidationError {
	type: "validation";
	on: string;
	summary?: string;
	message?: string;
	found?: unknown;
	property?: string;
	expected?: string;
}

/** Ingest API route definitions */
export interface IngestRoutes {
	"/": {
		get: {
			body: unknown;
			params: Record<never, string>;
			query: unknown;
			headers: unknown;
			response: {
				200: ErrorResponse | { message: string; version: string };
			};
		};
	};
	"/health": {
		get: {
			body: unknown;
			params: Record<never, string>;
			query: unknown;
			headers: unknown;
			response: {
				200:
					| ErrorResponse
					| {
							status: string;
							timestamp: string;
							build_id: string;
							service_id: string | undefined;
					  };
			};
		};
	};
	"/v1/identify": {
		post: {
			body: {
				device: {
					timestamp?: Date;
					os: {
						platform: DevicePlatformEnum;
						name: string;
						version: string;
					};
					application: {
						version: string;
						build_number: number;
					};
					hardware: {
						device_name: string;
						device_type: string;
						device_brand: string;
					};
					update: {
						is_enabled: boolean;
						update_id: string;
						update_channel: string;
						runtime_version: string;
						emergency_launch:
							| { is_emergency_launch: true; reason: string }
							| { is_emergency_launch: false; reason?: undefined };
						is_embedded_launch: boolean;
						created_at: string;
					} | null;
					notifications?: {
						push: {
							enabled: boolean;
							granted: boolean;
							token: string | null;
							platform: NotificationPlatformEnum;
						};
					};
				};
				user?: {
					persona_id?: string;
					user_id?: string;
					email?: string;
					name?: string;
				};
			};
			params: Record<never, string>;
			query: unknown;
			headers: {
				"td-org-id": string;
				"td-project-id": string;
				"td-environment-slug": string;
				"td-api-key": string;
				"td-device-id": string;
				"td-session-id"?: string;
			};
			response: {
				200: {
					success: true;
					data: {
						session_id: string;
						device_id: string;
						user_id: string;
						token: string;
						version_info: {
							status: IdentifyVersionStatusEnum;
							update: {
								version: string;
								build: string;
								update_id: string;
								effective_date: Date;
								release_notes: string | null;
							} | null;
						};
					};
				};
				400: {
					success: false;
					error:
						| { code: "MISSING_ORG_ID"; message: string }
						| { code: "MISSING_PROJECT_ID"; message: string }
						| { code: "MISSING_ENVIRONMENT_SLUG"; message: string }
						| { code: "MISSING_DEVICE_ID"; message: string }
						| { code: "IDENTIFY_FAILED"; message: string }
						| { code: "NO_SESSION_ID_GENERATED"; message: string }
						| { code: "NO_DEVICE_ID_GENERATED"; message: string }
						| { code: "NO_USER_ID_GENERATED"; message: string };
				};
				422: ValidationError;
			};
		};
	};
	"/v1/events": {
		post: {
			body: {
				events: Array<{
					event_name: string;
					event_type: "action" | "custom" | "screen_view";
					properties?: Record<string, unknown>;
					timestamp?: string;
					session_id?: string;
					device_id?: string;
				}>;
				session_id?: string;
				device_id?: string;
			};
			params: Record<never, string>;
			query: unknown;
			headers: {
				"td-org-id": string;
				"td-project-id": string;
				"td-environment-slug": string;
				"td-api-key": string;
				"td-device-id"?: string;
				"td-session-id"?: string;
			};
			response: {
				200: {
					success: true;
					data: {
						event_ids: string[];
						processed_count: number;
						failed_count: number;
					};
				};
				400: {
					success: false;
					error:
						| { code: "MISSING_ORG_ID"; message: string }
						| { code: "MISSING_PROJECT_ID"; message: string }
						| { code: "MISSING_ENVIRONMENT_SLUG"; message: string }
						| { code: "MISSING_DEVICE_ID"; message: string }
						| { code: "EVENTS_PROCESSING_FAILED"; message: string }
						| { code: "INVALID_SESSION"; message: string }
						| { code: "INVALID_DEVICE"; message: string }
						| { code: "BATCH_SIZE_EXCEEDED"; message: string }
						| { code: "VALIDATION_ERROR"; message: string };
				};
				422: ValidationError;
			};
		};
	};
}

/** All available endpoints */
export type IngestEndpoint = keyof IngestRoutes;

/** Get route definition for an endpoint and method */
export type GetRoute<
	E extends IngestEndpoint,
	M extends keyof IngestRoutes[E],
> = IngestRoutes[E][M];

/** Extract success response type (200) */
export type SuccessResponse<
	E extends IngestEndpoint,
	M extends keyof IngestRoutes[E],
> = GetRoute<E, M> extends { response: { 200: infer R } } ? R : never;

/** Extract error response types (non-200) */
export type ErrorResponses<
	E extends IngestEndpoint,
	M extends keyof IngestRoutes[E],
> = GetRoute<E, M> extends { response: infer R }
	? R extends Record<number, unknown>
		? { [K in Exclude<keyof R, 200>]: R[K] }[Exclude<keyof R, 200>]
		: never
	: never;
`;

	await writeFile(routesPath, routeTypes, "utf-8");
}

generateTypes();
