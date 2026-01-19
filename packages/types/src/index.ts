import type { Database, Enums, Json, TablesInsert, TablesUpdate } from "./generated-types";

export * from "./generated-consts";
export type { Database, Enums, Json };

export type Tables = Database["public"]["Tables"];
export type TableKeys = keyof Tables;
export type Table<T extends TableKeys> = Tables[T]["Row"];
export type Insert<T extends TableKeys> = TablesInsert<T>;
export type Update<T extends TableKeys> = TablesUpdate<T>;

/**
 * A result of a successful operation
 * @param Success - The success type
 * @returns A {@link Success}
 */
export type SuccessResult<Success> = {
	success: true;
	data: Success;
};

/**
 * A result of a failed operation
 * @param Error - The error type
 * @returns A {@link ErrorResult}
 */
export type ErrorResult<Error = string> = {
	success: false;
	error: Error;
};

/**
 * A result of a successful or failed operation
 * @param Success - The success type
 * @param Error - The error type
 * @returns A {@link SuccessResult} or {@link ErrorResult}
 */
export type Result<Success, Error = string> = SuccessResult<Success> | ErrorResult<Error>;

/**
 * A promise that resolves to a {@link Result}
 * @param Success - The success type
 * @param Error - The error type
 * @returns A promise that resolves to a {@link Result}
 */
export type AsyncResult<Success, Error = string> = Promise<Result<Success, Error>>;

// Export Eden Treaty types for query utilities
export * from "./eden-treaty.types";
// Export Service class and related types
export { type LoggingContext, Service } from "./interfaces/service.interface";
