import { type Static, Type } from "@sinclair/typebox";
import type { AssertSchemaCompatibleWithRow, AssertTrue } from "../../common";

/**
 * Base project user schema
 * Represents project_users table structure
 */
export const ProjectUserSchema = Type.Object({
	id: Type.String({ format: "uuid" }),
	environment_id: Type.String({ format: "uuid" }),
	user_id: Type.Union([Type.String(), Type.Null()]),
	name: Type.Union([Type.String(), Type.Null()]),
	email: Type.Union([Type.String({ format: "email" }), Type.Null()]),
	created_at: Type.String(),
	updated_at: Type.String(),
});
export type ProjectUser = Static<typeof ProjectUserSchema>;

/**
 * Project user params schema
 */
export const ProjectUserParamsSchema = Type.Object({
	user_id: Type.String({ format: "uuid" }),
});
export type ProjectUserParams = Static<typeof ProjectUserParamsSchema>;

/**
 * Search project users query schema
 * Supports pagination, search, and sorting
 */
export const SearchProjectUsersQuerySchema = Type.Object({
	project_id: Type.String({ format: "uuid" }),
	page: Type.Number({ minimum: 1, default: 1 }),
	limit: Type.Number({ minimum: 1, maximum: 100, default: 20 }),
	search: Type.Optional(Type.String()),
	sort_by: Type.Union(
		[Type.Literal("created_at"), Type.Literal("updated_at"), Type.Literal("name"), Type.Literal("email")],
		{
			default: "created_at",
		}
	),
	sort_order: Type.Union([Type.Literal("asc"), Type.Literal("desc")], { default: "desc" }),
});
export type SearchProjectUsersQuery = Static<typeof SearchProjectUsersQuerySchema>;

/**
 * Search project users query schema without project_id (injected from headers)
 */
export const SearchProjectUsersQueryParamsSchema = Type.Omit(SearchProjectUsersQuerySchema, ["project_id"]);
export type SearchProjectUsersQueryParams = Static<typeof SearchProjectUsersQueryParamsSchema>;

/**
 * Project users by IDs request schema
 */
export const ProjectUsersByIdsSchema = Type.Object({
	user_ids: Type.Array(Type.String({ format: "uuid" }), { minItems: 1, maxItems: 100 }),
});
export type ProjectUsersByIds = Static<typeof ProjectUsersByIdsSchema>;

/**
 * Paginated project users response schema
 */
export const ProjectUsersResponseSchema = Type.Object({
	users: Type.Array(ProjectUserSchema),
	pagination: Type.Object({
		page: Type.Integer({ minimum: 1 }),
		limit: Type.Integer({ minimum: 1 }),
		total: Type.Integer({ minimum: 0 }),
		total_pages: Type.Integer({ minimum: 0 }),
	}),
});
export type ProjectUsersResponse = Static<typeof ProjectUsersResponseSchema>;

/**
 * Single project user response schema
 */
export const ProjectUserResponseSchema = Type.Object({
	success: Type.Literal(true),
	data: ProjectUserSchema,
});
export type ProjectUserResponse = Static<typeof ProjectUserResponseSchema>;

/**
 * Project user error response schema
 * Discriminated union by error code
 */
export const ProjectUserErrorSchema = Type.Union([
	Type.Object({
		code: Type.Literal("USER_NOT_FOUND"),
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
export type ProjectUserError = Static<typeof ProjectUserErrorSchema>;

/**
 * Project user error response wrapper
 */
export const ProjectUserErrorResponseSchema = Type.Object({
	success: Type.Literal(false),
	error: ProjectUserErrorSchema,
});
export type ProjectUserErrorResponse = Static<typeof ProjectUserErrorResponseSchema>;

/**
 * Project user request response schema
 */
export const ProjectUserRequestResponseSchema = Type.Union([ProjectUserResponseSchema, ProjectUserErrorResponseSchema]);
export type ProjectUserRequestResponse = Static<typeof ProjectUserRequestResponseSchema>;

export type _CheckProjectUserRow = AssertTrue<AssertSchemaCompatibleWithRow<ProjectUser, "project_users">>;
