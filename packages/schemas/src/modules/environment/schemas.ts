import { type Static, Type } from "@sinclair/typebox";
import { EnvironmentTypeEnum } from "@teardown/types";
import type {
	AssertSchemaCompatibleWithInsert,
	AssertSchemaCompatibleWithRow,
	AssertSchemaCompatibleWithUpdate,
	AssertTrue,
} from "../../common";

/**
 * Environment type enum (re-exported for backward compatibility)
 * @deprecated Use EnvironmentTypeEnum from @teardown/types instead
 */
export { EnvironmentTypeEnum as EnvironmentType };

/**
 * Environment schema
 * Represents an environment within a project
 */
export const EnvironmentSchema = Type.Object({
	id: Type.String({ format: "uuid" }),
	project_id: Type.String({ format: "uuid" }),
	name: Type.String({ minLength: 1 }),
	slug: Type.String({ minLength: 1 }),
	type: Type.Enum(EnvironmentTypeEnum),
	created_at: Type.String(),
	updated_at: Type.String(),
});

/**
 * Parse and validate an EnvironmentTypeEnum value
 * Uses a switch statement to ensure type safety and runtime validation
 * @param value - The value to parse
 * @returns The validated EnvironmentTypeEnum value
 * @throws Error if the value is not a valid EnvironmentTypeEnum
 */
export function parseEnvironmentTypeEnum(value: unknown): EnvironmentTypeEnum {
	switch (value) {
		case EnvironmentTypeEnum.DEVELOPMENT:
			return EnvironmentTypeEnum.DEVELOPMENT;
		case EnvironmentTypeEnum.STAGING:
			return EnvironmentTypeEnum.STAGING;
		case EnvironmentTypeEnum.PRODUCTION:
			return EnvironmentTypeEnum.PRODUCTION;
		default:
			throw new Error(
				`Invalid EnvironmentTypeEnum value: ${value}. Expected one of: ${Object.values(EnvironmentTypeEnum).join(", ")}`
			);
	}
}

/**
 * Create environment schema
 * Used for creating new environments
 */
export const CreateEnvironmentSchema = Type.Object({
	project_id: Type.String({ format: "uuid" }),
	name: Type.String({ minLength: 1 }),
	slug: Type.String({ minLength: 1 }),
	type: Type.Enum(EnvironmentTypeEnum),
});

/**
 * Update environment schema
 * Used for updating existing environments
 */
export const UpdateEnvironmentSchema = Type.Object({
	name: Type.String({ minLength: 1 }),
	type: Type.Enum(EnvironmentTypeEnum),
});

/**
 * TypeScript types inferred from schemas
 */
export type Environment = Static<typeof EnvironmentSchema>;
export type CreateEnvironment = Static<typeof CreateEnvironmentSchema>;
export type UpdateEnvironment = Static<typeof UpdateEnvironmentSchema>;

export type _CheckEnvironmentRow = AssertTrue<AssertSchemaCompatibleWithRow<Environment, "environments">>;
export type _CheckCreateEnvironment = AssertTrue<AssertSchemaCompatibleWithInsert<CreateEnvironment, "environments">>;
export type _CheckUpdateEnvironment = AssertTrue<AssertSchemaCompatibleWithUpdate<UpdateEnvironment, "environments">>;
