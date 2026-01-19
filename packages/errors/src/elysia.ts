import { Elysia, ValidationError } from "elysia";
import {
	BadRequestError,
	ForbiddenError,
	handleError,
	InternalServerError,
	NotFoundError,
	RateLimitError,
	UnauthorizedError,
	UnprocessableContentError,
} from "./index";

export const ElysiaErrors = new Elysia()
	.error({
		FORBIDDEN: ForbiddenError,
		NOT_FOUND: NotFoundError,
		INTERNAL_SERVER_ERROR: InternalServerError,
		BAD_REQUEST: BadRequestError,
		UNAUTHORIZED: UnauthorizedError,
		UNPROCESSABLE_ENTITY: UnprocessableContentError,
		TOO_MANY_REQUESTS: RateLimitError,
		SERVICE_UNAVAILABLE: InternalServerError,
	})
	.onError(({ error, code, set }) => {
		// Skip logging validation errors - they're expected and properly handled by Elysia
		if (error instanceof ValidationError || code === "VALIDATION") {
			const result = handleError(error, code);
			set.status = result.status;
			return result.body;
		}

		console.error("[ErrorHandler] Unhandled error:", {
			code,
			error,
			errorType: typeof error,
			errorConstructor: error?.constructor?.name,
			errorMessage: error instanceof Error ? error.message : String(error),
			errorStack: error instanceof Error ? error.stack : undefined,
		});
		const result = handleError(error, code);
		set.status = result.status;
		return result.body;
	})
	.as("global");
