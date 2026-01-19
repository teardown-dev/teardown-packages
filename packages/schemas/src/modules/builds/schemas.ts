import { type Static, Type } from "@sinclair/typebox";
import { VersionBuildStatusEnum } from "@teardown/types";
import type { AssertSchemaCompatibleWithRow, AssertTrue } from "../../common";
import { DevicePlatformSchema } from "../devices/schemas";

/**
 * Build status enum matching database (reuses VersionBuildStatusEnum)
 */
export const BuildStatusSchema = Type.Enum(VersionBuildStatusEnum);
export type BuildStatus = Static<typeof BuildStatusSchema>;

/**
 * Base build schema
 * Represents version_builds table structure
 */
export const BuildSchema = Type.Object({
	id: Type.String({ format: "uuid" }),
	version_id: Type.String({ format: "uuid" }),
	build_number: Type.Integer({ minimum: 0 }),
	name: Type.Union([Type.String(), Type.Null()]),
	notes: Type.Union([Type.String({ maxLength: 500 }), Type.Null()]),
	commit_sha: Type.Union([Type.String(), Type.Null()]),
	platform: DevicePlatformSchema,
	status: BuildStatusSchema,
	fingerprint: Type.Union([Type.String(), Type.Null()]),
	created_at: Type.String(),
	updated_at: Type.String(),
});
export type Build = Static<typeof BuildSchema>;

/**
 * Build params schema
 */
export const BuildParamsSchema = Type.Object({
	build_id: Type.String({ format: "uuid" }),
});
export type BuildParams = Static<typeof BuildParamsSchema>;

/**
 * Search builds query schema
 * Supports pagination, search, and sorting
 */
export const SearchBuildsQuerySchema = Type.Object({
	project_id: Type.String({ format: "uuid" }),
	page: Type.Number({ minimum: 1, default: 1 }),
	limit: Type.Number({ minimum: 1, maximum: 100, default: 20 }),
	search: Type.Optional(Type.String()),
	sort_by: Type.Union(
		[
			Type.Literal("created_at"),
			Type.Literal("updated_at"),
			Type.Literal("build_number"),
			Type.Literal("platform"),
			Type.Literal("name"),
		],
		{ default: "created_at" }
	),
	sort_order: Type.Union([Type.Literal("asc"), Type.Literal("desc")], { default: "desc" }),
});
export type SearchBuildsQuery = Static<typeof SearchBuildsQuerySchema>;

/**
 * Search builds query schema without project_id (injected from headers)
 */
export const SearchBuildsQueryParamsSchema = Type.Omit(SearchBuildsQuerySchema, ["project_id"]);
export type SearchBuildsQueryParams = Static<typeof SearchBuildsQueryParamsSchema>;

/**
 * Builds by IDs request schema
 */
export const BuildsByIdsSchema = Type.Object({
	build_ids: Type.Array(Type.String({ format: "uuid" }), { minItems: 1, maxItems: 100 }),
});
export type BuildsByIds = Static<typeof BuildsByIdsSchema>;

/**
 * Paginated builds response schema
 */
export const BuildsResponseSchema = Type.Object({
	builds: Type.Array(BuildSchema),
	pagination: Type.Object({
		page: Type.Integer({ minimum: 1 }),
		limit: Type.Integer({ minimum: 1 }),
		total: Type.Integer({ minimum: 0 }),
		total_pages: Type.Integer({ minimum: 0 }),
	}),
});
export type BuildsResponse = Static<typeof BuildsResponseSchema>;

/**
 * Single build response schema
 */
export const BuildResponseSchema = Type.Object({
	success: Type.Literal(true),
	data: BuildSchema,
});
export type BuildResponse = Static<typeof BuildResponseSchema>;

/**
 * Build error response schema
 * Discriminated union by error code
 */
export const BuildErrorSchema = Type.Union([
	Type.Object({
		code: Type.Literal("BUILD_NOT_FOUND"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("PROJECT_NOT_FOUND"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("FORBIDDEN"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("FETCH_FAILED"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("INVALID_PARAMS"),
		message: Type.String(),
	}),
]);
export type BuildError = Static<typeof BuildErrorSchema>;

/**
 * Build error response wrapper
 */
export const BuildErrorResponseSchema = Type.Object({
	success: Type.Literal(false),
	error: BuildErrorSchema,
});
export type BuildErrorResponse = Static<typeof BuildErrorResponseSchema>;

/**
 * Build request response schema
 */
export const BuildRequestResponseSchema = Type.Union([BuildResponseSchema, BuildErrorResponseSchema]);
export type BuildRequestResponse = Static<typeof BuildRequestResponseSchema>;

export type _CheckBuildRow = AssertTrue<AssertSchemaCompatibleWithRow<Build, "version_builds">>;

/**
 * Update build request body schema
 * Supports updating status and/or notes
 */
export const UpdateBuildBodySchema = Type.Object({
	status: Type.Optional(BuildStatusSchema),
	notes: Type.Optional(Type.Union([Type.String({ maxLength: 500 }), Type.Null()])),
});
export type UpdateBuildBody = Static<typeof UpdateBuildBodySchema>;

/**
 * Add UPDATE_FAILED error code for update operations
 */
export const BuildErrorSchemaWithUpdate = Type.Union([
	BuildErrorSchema,
	Type.Object({
		code: Type.Literal("UPDATE_FAILED"),
		message: Type.String(),
	}),
]);
export type BuildErrorWithUpdate = Static<typeof BuildErrorSchemaWithUpdate>;

/**
 * Build error response wrapper with update error
 */
export const BuildErrorResponseWithUpdateSchema = Type.Object({
	success: Type.Literal(false),
	error: BuildErrorSchemaWithUpdate,
});
export type BuildErrorResponseWithUpdate = Static<typeof BuildErrorResponseWithUpdateSchema>;
