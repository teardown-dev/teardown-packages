import { type Static, Type } from "@sinclair/typebox";
import { VersionBuildStatusEnum } from "@teardown/types";
import type { AssertSchemaCompatibleWithRow, AssertTrue } from "../../common";

/**
 * Version status enum matching database
 */
export const VersionBuildStatusSchema = Type.Enum(VersionBuildStatusEnum);
export type VersionBuildStatus = Static<typeof VersionBuildStatusSchema>;

/**
 * Parse and validate a VersionBuildStatusEnum value
 * Uses a switch statement to ensure type safety and runtime validation
 * @param value - The value to parse
 * @returns The validated VersionBuildStatusEnum value
 * @throws Error if the value is not a valid VersionBuildStatusEnum
 */
export function parseVersionStatusEnum(value: unknown): VersionBuildStatusEnum {
	switch (value) {
		case VersionBuildStatusEnum.SUPPORTED:
			return VersionBuildStatusEnum.SUPPORTED;
		case VersionBuildStatusEnum.UPDATE_AVAILABLE:
			return VersionBuildStatusEnum.UPDATE_AVAILABLE;
		case VersionBuildStatusEnum.UPDATE_RECOMMENDED:
			return VersionBuildStatusEnum.UPDATE_RECOMMENDED;
		case VersionBuildStatusEnum.UPDATE_REQUIRED:
			return VersionBuildStatusEnum.UPDATE_REQUIRED;
		default:
			throw new Error(
				`Invalid VersionBuildStatusEnum value: ${value}. Expected one of: ${Object.values(VersionBuildStatusEnum).join(", ")}`
			);
	}
}

/**
 * Base version schema
 * Represents project_versions table structure
 */
export const VersionSchema = Type.Object({
	id: Type.String({ format: "uuid" }),
	project_id: Type.String({ format: "uuid" }),
	name: Type.String(),
	major: Type.Number(), // Matches type number, not integer constraint (db type numeric)
	minor: Type.Number(),
	patch: Type.Number(),
	notes: Type.Union([Type.String({ maxLength: 500 }), Type.Null()]),
	status: VersionBuildStatusSchema, // SUPPORTED, UPDATE_AVAILABLE, UPDATE_RECOMMENDED, UPDATE_REQUIRED - controls if version is active
	created_at: Type.String(),
	updated_at: Type.String(),
});
export type Version = Static<typeof VersionSchema>;

/**
 * Version params schema
 */
export const VersionParamsSchema = Type.Object({
	version_id: Type.String({ format: "uuid" }),
});
export type VersionParams = Static<typeof VersionParamsSchema>;

/**
 * Search versions query schema
 * Supports pagination, search, and sorting
 */
export const SearchVersionsQuerySchema = Type.Object({
	project_id: Type.String({ format: "uuid" }),
	page: Type.Number({ minimum: 1, default: 1 }),
	limit: Type.Number({ minimum: 1, maximum: 100, default: 20 }),
	search: Type.Optional(Type.String()),
	sort_by: Type.Union(
		[
			Type.Literal("created_at"),
			Type.Literal("updated_at"),
			Type.Literal("name"),
			Type.Literal("major"),
			Type.Literal("minor"),
			Type.Literal("patch"),
		],
		{ default: "created_at" }
	),
	sort_order: Type.Union([Type.Literal("asc"), Type.Literal("desc")], { default: "desc" }),
});
export type SearchVersionsQuery = Static<typeof SearchVersionsQuerySchema>;

/**
 * Search versions query schema without project_id (injected from headers)
 */
export const SearchVersionsQueryParamsSchema = Type.Omit(SearchVersionsQuerySchema, ["project_id"]);
export type SearchVersionsQueryParams = Static<typeof SearchVersionsQueryParamsSchema>;

/**
 * Versions by IDs request schema
 */
export const VersionsByIdsSchema = Type.Object({
	version_ids: Type.Array(Type.String({ format: "uuid" }), { minItems: 1, maxItems: 100 }),
});
export type VersionsByIds = Static<typeof VersionsByIdsSchema>;

/**
 * Paginated versions response schema
 */
export const VersionsResponseSchema = Type.Object({
	versions: Type.Array(VersionSchema),
	pagination: Type.Object({
		page: Type.Integer({ minimum: 1 }),
		limit: Type.Integer({ minimum: 1 }),
		total: Type.Integer({ minimum: 0 }),
		total_pages: Type.Integer({ minimum: 0 }),
	}),
});
export type VersionsResponse = Static<typeof VersionsResponseSchema>;

/**
 * Single version response schema
 */
export const VersionResponseSchema = Type.Object({
	success: Type.Literal(true),
	data: VersionSchema,
});
export type VersionResponse = Static<typeof VersionResponseSchema>;

/**
 * Version error response schema
 * Discriminated union by error code
 */
export const VersionErrorSchema = Type.Union([
	Type.Object({
		code: Type.Literal("VERSION_NOT_FOUND"),
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
export type VersionError = Static<typeof VersionErrorSchema>;

/**
 * Version error response wrapper
 */
export const VersionErrorResponseSchema = Type.Object({
	success: Type.Literal(false),
	error: VersionErrorSchema,
});
export type VersionErrorResponse = Static<typeof VersionErrorResponseSchema>;

/**
 * Version request response schema
 */
export const VersionRequestResponseSchema = Type.Union([VersionResponseSchema, VersionErrorResponseSchema]);
export type VersionRequestResponse = Static<typeof VersionRequestResponseSchema>;

export type _CheckVersionRow = AssertTrue<AssertSchemaCompatibleWithRow<Version, "project_versions">>;

/**
 * Update version request body schema
 * Supports updating status and/or notes
 */
export const UpdateVersionBodySchema = Type.Object({
	status: Type.Optional(VersionBuildStatusSchema),
	notes: Type.Optional(Type.Union([Type.String({ maxLength: 500 }), Type.Null()])),
});
export type UpdateVersionBody = Static<typeof UpdateVersionBodySchema>;

/**
 * Add UPDATE_FAILED error code for update operations
 */
export const VersionErrorSchemaWithUpdate = Type.Union([
	VersionErrorSchema,
	Type.Object({
		code: Type.Literal("UPDATE_FAILED"),
		message: Type.String(),
	}),
]);
export type VersionErrorWithUpdate = Static<typeof VersionErrorSchemaWithUpdate>;

/**
 * Version error response wrapper with update error
 */
export const VersionErrorResponseWithUpdateSchema = Type.Object({
	success: Type.Literal(false),
	error: VersionErrorSchemaWithUpdate,
});
export type VersionErrorResponseWithUpdate = Static<typeof VersionErrorResponseWithUpdateSchema>;
