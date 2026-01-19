import { type Static, Type } from "@sinclair/typebox";
import { ProjectStatusEnum, ProjectTypeEnum } from "@teardown/types";
import {
	type AssertSchemaCompatibleWithInsert,
	type AssertSchemaCompatibleWithRow,
	type AssertSchemaCompatibleWithUpdate,
	type AssertTrue,
	SlugSchema,
} from "../../common";

/**
 * Parse and validate a ProjectTypeEnum value
 * Uses a switch statement to ensure type safety and runtime validation
 * @param value - The value to parse
 * @returns The validated ProjectTypeEnum value
 * @throws Error if the value is not a valid ProjectTypeEnum
 */
export function parseProjectTypeEnum(value: unknown): ProjectTypeEnum {
	switch (value) {
		case ProjectTypeEnum.REACT_NATIVE:
			return ProjectTypeEnum.REACT_NATIVE;
		case ProjectTypeEnum.EXPO:
			return ProjectTypeEnum.EXPO;
		default:
			throw new Error(
				`Invalid ProjectTypeEnum value: ${value}. Expected one of: ${Object.values(ProjectTypeEnum).join(", ")}`
			);
	}
}

/**
 * Parse and validate a ProjectStatusEnum value
 * Uses a switch statement to ensure type safety and runtime validation
 * @param value - The value to parse
 * @returns The validated ProjectStatusEnum value
 * @throws Error if the value is not a valid ProjectStatusEnum
 */
export function parseProjectStatusEnum(value: unknown): ProjectStatusEnum {
	switch (value) {
		case ProjectStatusEnum.PENDING_SETUP:
			return ProjectStatusEnum.PENDING_SETUP;
		case ProjectStatusEnum.ACTIVE:
			return ProjectStatusEnum.ACTIVE;
		case ProjectStatusEnum.PAUSED:
			return ProjectStatusEnum.PAUSED;
		case ProjectStatusEnum.ARCHIVED:
			return ProjectStatusEnum.ARCHIVED;
		default:
			throw new Error(
				`Invalid ProjectStatusEnum value: ${value}. Expected one of: ${Object.values(ProjectStatusEnum).join(", ")}`
			);
	}
}

/**
 * Base project schema
 * Represents projects table structure
 */
export const ProjectSchema = Type.Object({
	id: Type.String({ format: "uuid" }),
	org_id: Type.String({ format: "uuid" }),
	name: Type.String({ minLength: 1 }),
	slug: SlugSchema,
	type: Type.Enum(ProjectTypeEnum),
	status: Type.Enum(ProjectStatusEnum),
	push_notifications_enabled: Type.Boolean(),
	first_session_at: Type.Union([Type.String(), Type.Null()]),
	created_at: Type.String(),
	updated_at: Type.String(),
});
export type Project = Static<typeof ProjectSchema>;

export const ProjectParamsSchema = Type.Object({
	project_id_or_slug: Type.String(),
});
export type ProjectParams = Static<typeof ProjectParamsSchema>;

/**
 * Create project request schema
 */
export const CreateProjectSchema = Type.Object({
	name: Type.String({ minLength: 1, maxLength: 255 }),
	slug: SlugSchema,
	type: Type.Enum(ProjectTypeEnum),
	org_id: Type.String(),
});
export type CreateProject = Static<typeof CreateProjectSchema>;

/**
 * Update project request schema
 */
export const UpdateProjectSchema = Type.Object({
	name: Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
	slug: Type.Optional(SlugSchema),
	push_notifications_enabled: Type.Optional(Type.Boolean()),
});
export type UpdateProject = Static<typeof UpdateProjectSchema>;

/**
 * Single project response schema
 */
export const ProjectResponseSchema = Type.Object({
	success: Type.Literal(true),
	data: ProjectSchema,
});
export type ProjectResponse = Static<typeof ProjectResponseSchema>;

/**
 * Multiple projects response schema
 */
export const ProjectsResponseSchema = Type.Object({
	projects: Type.Array(ProjectSchema),
});
export type ProjectsResponse = Static<typeof ProjectsResponseSchema>;

/**
 * Project error response schema
 * Discriminated union by error code
 */
export const ProjectErrorSchema = Type.Union([
	Type.Object({
		code: Type.Literal("PROJECT_NOT_FOUND"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("PROJECT_NOT_IN_ORG"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("INVALID_SLUG"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("SLUG_ALREADY_EXISTS"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("FORBIDDEN"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("CREATE_FAILED"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("UPDATE_FAILED"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("DELETE_FAILED"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("FETCH_FAILED"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("ARCHIVE_FAILED"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("INVALID_REQUEST"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("PROJECT_LIMIT_REACHED"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("CHECK_SESSIONS_FAILED"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("RATE_LIMITED"),
		message: Type.String(),
	}),
]);
export type ProjectError = Static<typeof ProjectErrorSchema>;

/**
 * Project error response wrapper
 */
export const ProjectErrorResponseSchema = Type.Object({
	success: Type.Literal(false),
	error: ProjectErrorSchema,
});
export type ProjectErrorResponse = Static<typeof ProjectErrorResponseSchema>;

export const ProjectRequestResponseSchema = Type.Union([ProjectResponseSchema, ProjectErrorResponseSchema]);
export type ProjectRequestResponse = Static<typeof ProjectRequestResponseSchema>;

/**
 * Check sessions response schema
 * Returns whether project has received sessions and updates first_session_at
 */
export const CheckSessionsResponseSchema = Type.Object({
	success: Type.Literal(true),
	data: Type.Object({
		has_sessions: Type.Boolean(),
		first_session_at: Type.Union([Type.String(), Type.Null()]),
		project: ProjectSchema,
	}),
});
export type CheckSessionsResponse = Static<typeof CheckSessionsResponseSchema>;

export const CheckSessionsRequestResponseSchema = Type.Union([CheckSessionsResponseSchema, ProjectErrorResponseSchema]);
export type CheckSessionsRequestResponse = Static<typeof CheckSessionsRequestResponseSchema>;

/**
 * Nuke project data response schema
 */
export const NukeDataResultSchema = Type.Object({
	sessionsDeleted: Type.Number(),
	devicesDeleted: Type.Number(),
	usersDeleted: Type.Number(),
	eventsDeleted: Type.Number(),
	versionsDeleted: Type.Number(),
	buildsDeleted: Type.Number(),
});
export type NukeDataResult = Static<typeof NukeDataResultSchema>;

export const NukeDataResponseSchema = Type.Object({
	success: Type.Literal(true),
	data: NukeDataResultSchema,
});
export type NukeDataResponse = Static<typeof NukeDataResponseSchema>;

/**
 * Nuke data error schema
 */
export const NukeDataErrorSchema = Type.Union([
	Type.Object({
		code: Type.Literal("UNAUTHORIZED"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("NUKE_FAILED"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("PROJECT_NOT_FOUND"),
		message: Type.String(),
	}),
]);
export type NukeDataError = Static<typeof NukeDataErrorSchema>;

export const NukeDataErrorResponseSchema = Type.Object({
	success: Type.Literal(false),
	error: NukeDataErrorSchema,
});
export type NukeDataErrorResponse = Static<typeof NukeDataErrorResponseSchema>;

export type _CheckProjectRow = AssertTrue<AssertSchemaCompatibleWithRow<Project, "projects">>;
export type _CheckCreateProject = AssertTrue<AssertSchemaCompatibleWithInsert<CreateProject, "projects">>;
export type _CheckUpdateProject = AssertTrue<AssertSchemaCompatibleWithUpdate<UpdateProject, "projects">>;
