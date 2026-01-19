import type { Insert, Tables, Update } from "@teardown/types";

/**
 * Forces TypeScript to error if T is not `true`.
 * Wrap assertion types with this to ensure compile-time validation.
 *
 * @example
 * ```ts
 * type _Check = AssertTrue<AssertSchemaCompatibleWithRow<Project, "projects">>;
 * ```
 */
export type AssertTrue<T extends true> = T;

/**
 * Type-level assertion that ensures SchemaType is compatible with DbType.
 * This will cause a TypeScript error if SchemaType cannot be assigned to DbType.
 *
 * @example
 * ```ts
 * type _Check = AssertTrue<AssertCompatible<Project, Tables<"projects">["Row"]>>;
 * ```
 */
export type AssertCompatible<SchemaType, DbType> = SchemaType extends DbType
	? DbType extends SchemaType
		? true
		: never
	: never;

/**
 * Type-level assertion that ensures SchemaType can be assigned to DbType.
 * This is less strict than AssertCompatible - it only checks one-way assignment.
 *
 * @example
 * ```ts
 * type _Check = AssertAssignable<CreateProject, Insert<"projects">>;
 * ```
 */
export type AssertAssignable<SchemaType, DbType> = SchemaType extends DbType ? true : never;

/**
 * Helper to check if a schema type is compatible with a database Row type
 *
 * @example
 * ```ts
 * export type _CheckProjectRow = AssertSchemaCompatibleWithRow<Project, "projects">;
 * ```
 */
export type AssertSchemaCompatibleWithRow<SchemaType, TableName extends keyof Tables> = AssertCompatible<
	SchemaType,
	Tables[TableName]["Row"]
>;

/**
 * Helper to check if a create schema type is compatible with a database Insert type
 *
 * @example
 * ```ts
 * type _CheckCreateProject = AssertSchemaCompatibleWithInsert<CreateProject, "projects">;
 * ```
 */
export type AssertSchemaCompatibleWithInsert<SchemaType, TableName extends keyof Tables> = AssertAssignable<
	SchemaType,
	Insert<TableName>
>;

/**
 * Helper to check if an update schema type is compatible with a database Update type
 *
 * @example
 * ```ts
 * type _CheckUpdateProject = AssertSchemaCompatibleWithUpdate<UpdateProject, "projects">;
 * ```
 */
export type AssertSchemaCompatibleWithUpdate<SchemaType, TableName extends keyof Tables> = AssertAssignable<
	SchemaType,
	Update<TableName>
>;
