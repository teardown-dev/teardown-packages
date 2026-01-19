import { type Static, Type } from "@sinclair/typebox";
import { VersionBuildStatusSchema } from "../versions/schemas";

/**
 * Version adoption schema
 */
export const VersionAdoptionPointSchema = Type.Object({
	date: Type.String(), // YYYY-MM-DD
	versions: Type.Record(Type.String(), Type.Number()), // version -> count
});
export type VersionAdoptionPoint = Static<typeof VersionAdoptionPointSchema>;

export const VersionAdoptionResponseSchema = Type.Object({
	success: Type.Literal(true),
	data: Type.Array(VersionAdoptionPointSchema),
});
export type VersionAdoptionResponse = Static<typeof VersionAdoptionResponseSchema>;

/**
 * Active sessions trend schema
 */
export const ActiveSessionsPointSchema = Type.Object({
	date: Type.String(), // YYYY-MM-DD
	count: Type.Integer({ minimum: 0 }),
});
export type ActiveSessionsPoint = Static<typeof ActiveSessionsPointSchema>;

export const ActiveSessionsTrendResponseSchema = Type.Object({
	success: Type.Literal(true),
	data: Type.Array(ActiveSessionsPointSchema),
});
export type ActiveSessionsTrendResponse = Static<typeof ActiveSessionsTrendResponseSchema>;

/**
 * Active users schema (with platform breakdown)
 */
export const ActiveUsersSchema = Type.Object({
	total: Type.Integer({ minimum: 0 }),
	ios: Type.Integer({ minimum: 0 }),
	android: Type.Integer({ minimum: 0 }),
	trend: Type.Number(), // percentage change vs previous period
});
export type ActiveUsers = Static<typeof ActiveUsersSchema>;

export const ActiveUsersResponseSchema = Type.Object({
	success: Type.Literal(true),
	data: ActiveUsersSchema,
});
export type ActiveUsersResponse = Static<typeof ActiveUsersResponseSchema>;

/**
 * Active users query params schema
 */
export const ActiveUsersQuerySchema = Type.Object({
	start_date: Type.String({ format: "date-time" }),
	end_date: Type.String({ format: "date-time" }),
});
export type ActiveUsersQuery = Static<typeof ActiveUsersQuerySchema>;

/**
 * Build adoption schema (with platform breakdown)
 */
export const BuildStatsSchema = Type.Object({
	total: Type.Integer({ minimum: 0 }),
	ios: Type.Integer({ minimum: 0 }),
	android: Type.Integer({ minimum: 0 }),
});
export type BuildStats = Static<typeof BuildStatsSchema>;

export const BuildAdoptionPointSchema = Type.Object({
	date: Type.String(), // YYYY-MM-DD
	builds: Type.Record(Type.String(), BuildStatsSchema), // build_number -> stats
});
export type BuildAdoptionPoint = Static<typeof BuildAdoptionPointSchema>;

export const BuildAdoptionResponseSchema = Type.Object({
	success: Type.Literal(true),
	data: Type.Array(BuildAdoptionPointSchema),
});
export type BuildAdoptionResponse = Static<typeof BuildAdoptionResponseSchema>;

/**
 * Date range query params schema (shared)
 */
export const DateRangeQuerySchema = Type.Object({
	start_date: Type.String({ format: "date-time" }),
	end_date: Type.String({ format: "date-time" }),
});
export type DateRangeQuery = Static<typeof DateRangeQuerySchema>;

/**
 * Active versions/builds query params schema (with optional search)
 */
export const ActiveVersionsQuerySchema = Type.Object({
	start_date: Type.String({ format: "date-time" }),
	end_date: Type.String({ format: "date-time" }),
	search: Type.Optional(Type.String()),
});
export type ActiveVersionsQuery = Static<typeof ActiveVersionsQuerySchema>;

/**
 * Active versions & builds analytics schema
 * Aggregated session counts by version and build for a date range
 */
export const ActiveBuildStatsSchema = Type.Object({
	build_id: Type.String(),
	build_number: Type.Integer({ minimum: 0 }),
	platform: Type.Union([Type.Literal("IOS"), Type.Literal("ANDROID")]),
	session_count: Type.Integer({ minimum: 0 }),
	device_count: Type.Integer({ minimum: 0 }),
	user_count: Type.Integer({ minimum: 0 }),
	status: Type.Optional(VersionBuildStatusSchema),
});
export type ActiveBuildStats = Static<typeof ActiveBuildStatsSchema>;

export const ActiveVersionStatsSchema = Type.Object({
	version_id: Type.String(),
	version_name: Type.String(),
	session_count: Type.Integer({ minimum: 0 }),
	device_count: Type.Integer({ minimum: 0 }),
	user_count: Type.Integer({ minimum: 0 }),
	ios_count: Type.Integer({ minimum: 0 }),
	android_count: Type.Integer({ minimum: 0 }),
	version_status: Type.Optional(VersionBuildStatusSchema),
	builds: Type.Array(ActiveBuildStatsSchema),
});
export type ActiveVersionStats = Static<typeof ActiveVersionStatsSchema>;

export const ActiveVersionsBuildsSchema = Type.Object({
	versions: Type.Array(ActiveVersionStatsSchema),
});
export type ActiveVersionsBuilds = Static<typeof ActiveVersionsBuildsSchema>;

export const ActiveVersionsBuildsResponseSchema = Type.Object({
	success: Type.Literal(true),
	data: ActiveVersionsBuildsSchema,
});
export type ActiveVersionsBuildsResponse = Static<typeof ActiveVersionsBuildsResponseSchema>;

/**
 * Session with user/device data for build sessions endpoint
 */
export const SessionDeviceSchema = Type.Object({
	id: Type.String(),
	device_name: Type.Union([Type.String(), Type.Null()]),
	device_brand: Type.Union([Type.String(), Type.Null()]),
});
export type SessionDevice = Static<typeof SessionDeviceSchema>;

export const SessionUserSchema = Type.Object({
	id: Type.String(),
	user_id: Type.Union([Type.String(), Type.Null()]),
	email: Type.Union([Type.String(), Type.Null()]),
	name: Type.Union([Type.String(), Type.Null()]),
});
export type SessionUser = Static<typeof SessionUserSchema>;

export const SessionWithUserSchema = Type.Object({
	id: Type.String(),
	started_at: Type.String(),
	os_version: Type.Union([Type.String(), Type.Null()]),
	device: SessionDeviceSchema,
	user: Type.Union([SessionUserSchema, Type.Null()]),
});
export type SessionWithUser = Static<typeof SessionWithUserSchema>;

export const BuildSessionsQuerySchema = Type.Object({
	start_date: Type.String({ format: "date-time" }),
	end_date: Type.String({ format: "date-time" }),
	cursor: Type.Optional(Type.String()),
	limit: Type.Optional(Type.String({ default: "20" })),
	search: Type.Optional(Type.String()),
});
export type BuildSessionsQuery = Static<typeof BuildSessionsQuerySchema>;

export const BuildSessionsResponseSchema = Type.Object({
	success: Type.Literal(true),
	data: Type.Object({
		sessions: Type.Array(SessionWithUserSchema),
		next_cursor: Type.Union([Type.String(), Type.Null()]),
	}),
});
export type BuildSessionsResponse = Static<typeof BuildSessionsResponseSchema>;
