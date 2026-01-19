import { type Static, Type } from "@sinclair/typebox";
import type { AssertSchemaCompatibleWithRow, AssertTrue } from "../../common";

/**
 * Base session schema
 * Represents device_sessions table structure
 */
export const SessionSchema = Type.Object({
	id: Type.String({ format: "uuid" }),
	device_id: Type.String({ format: "uuid" }),
	token: Type.Union([Type.String(), Type.Null()]),
	version: Type.Union([Type.String(), Type.Null()]),
	version_id: Type.Union([Type.String({ format: "uuid" }), Type.Null()]),
	version_build_id: Type.Union([Type.String({ format: "uuid" }), Type.Null()]),
	os_version: Type.Union([Type.String(), Type.Null()]),
	ota_updates_enabled: Type.Union([Type.Boolean(), Type.Null()]),
	is_emergency_launch: Type.Union([Type.Boolean(), Type.Null()]),
	emergency_launch_reason: Type.Union([Type.String(), Type.Null()]),
	is_embedded_launch: Type.Union([Type.Boolean(), Type.Null()]),
	ota_update_id: Type.Union([Type.String({ format: "uuid" }), Type.Null()]),
	ota_update_runtime_version: Type.Union([Type.String(), Type.Null()]),
	ota_update_created_at: Type.Union([Type.String(), Type.Null()]),
	metadata: Type.Union([Type.Record(Type.String(), Type.Unknown()), Type.Null()]),
	started_at: Type.String(),
	created_at: Type.String(),
	updated_at: Type.String(),
});
export type Session = Static<typeof SessionSchema>;

/**
 * Session with device info for joined queries
 */
export const SessionWithDeviceSchema = Type.Composite([
	SessionSchema,
	Type.Object({
		device: Type.Optional(
			Type.Object({
				device_id: Type.String(),
				device_name: Type.Union([Type.String(), Type.Null()]),
				platform: Type.Union([Type.String(), Type.Null()]),
			})
		),
	}),
]);
export type SessionWithDevice = Static<typeof SessionWithDeviceSchema>;

/**
 * Session params schema
 */
export const SessionParamsSchema = Type.Object({
	session_id: Type.String({ format: "uuid" }),
});
export type SessionParams = Static<typeof SessionParamsSchema>;

/**
 * Search sessions query schema
 * Supports pagination, search, and sorting
 */
export const SearchSessionsQuerySchema = Type.Object({
	project_id: Type.String({ format: "uuid" }),
	page: Type.Number({ minimum: 1, default: 1 }),
	limit: Type.Number({ minimum: 1, maximum: 100, default: 20 }),
	search: Type.Optional(Type.String()),
	sort_by: Type.Union(
		[
			Type.Literal("started_at"),
			Type.Literal("created_at"),
			Type.Literal("updated_at"),
			Type.Literal("version"),
			Type.Literal("os_version"),
		],
		{ default: "started_at" }
	),
	sort_order: Type.Union([Type.Literal("asc"), Type.Literal("desc")], { default: "desc" }),
});
export type SearchSessionsQuery = Static<typeof SearchSessionsQuerySchema>;

/**
 * Search sessions query schema without project_id (injected from headers)
 */
export const SearchSessionsQueryParamsSchema = Type.Omit(SearchSessionsQuerySchema, ["project_id"]);
export type SearchSessionsQueryParams = Static<typeof SearchSessionsQueryParamsSchema>;

/**
 * Sessions by IDs request schema
 */
export const SessionsByIdsSchema = Type.Object({
	session_ids: Type.Array(Type.String({ format: "uuid" }), { minItems: 1, maxItems: 100 }),
});
export type SessionsByIds = Static<typeof SessionsByIdsSchema>;

/**
 * Paginated sessions response schema
 */
export const SessionsResponseSchema = Type.Object({
	sessions: Type.Array(SessionWithDeviceSchema),
	pagination: Type.Object({
		page: Type.Integer({ minimum: 1 }),
		limit: Type.Integer({ minimum: 1 }),
		total: Type.Integer({ minimum: 0 }),
		total_pages: Type.Integer({ minimum: 0 }),
	}),
});
export type SessionsResponse = Static<typeof SessionsResponseSchema>;

/**
 * Single session response schema
 */
export const SessionResponseSchema = Type.Object({
	success: Type.Literal(true),
	data: SessionWithDeviceSchema,
});
export type SessionResponse = Static<typeof SessionResponseSchema>;

/**
 * Session error response schema
 * Discriminated union by error code
 */
export const SessionErrorSchema = Type.Union([
	Type.Object({
		code: Type.Literal("SESSION_NOT_FOUND"),
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
export type SessionError = Static<typeof SessionErrorSchema>;

/**
 * Session error response wrapper
 */
export const SessionErrorResponseSchema = Type.Object({
	success: Type.Literal(false),
	error: SessionErrorSchema,
});
export type SessionErrorResponse = Static<typeof SessionErrorResponseSchema>;

/**
 * Session request response schema
 */
export const SessionRequestResponseSchema = Type.Union([SessionResponseSchema, SessionErrorResponseSchema]);
export type SessionRequestResponse = Static<typeof SessionRequestResponseSchema>;

export type _CheckSessionRow = AssertTrue<AssertSchemaCompatibleWithRow<Session, "device_sessions">>;
