import { ZodError } from "zod";

export enum ErrorCodes {
	Continue = 100,
	SwitchingProtocols = 101,
	Processing = 102,
	EarlyHints = 103,
	OK = 200,
	Created = 201,
	Accepted = 202,
	NonAuthoritativeInformation = 203,
	NoContent = 204,
	ResetContent = 205,
	PartialContent = 206,
	MultiStatus = 207,
	AlreadyReported = 208,
	MultipleChoices = 300,
	MovedPermanently = 301,
	Found = 302,
	SeeOther = 303,
	NotModified = 304,
	TemporaryRedirect = 307,
	PermanentRedirect = 308,
	BadRequest = 400,
	Unauthorized = 401,
	PaymentRequired = 402,
	Forbidden = 403,
	NotFound = 404,
	MethodNotAllowed = 405,
	NotAcceptable = 406,
	ProxyAuthenticationRequired = 407,
	RequestTimeout = 408,
	Conflict = 409,
	Gone = 410,
	LengthRequired = 411,
	PreconditionFailed = 412,
	PayloadTooLarge = 413,
	UriTooLong = 414,
	UnsupportedMediaType = 415,
	RangeNotSatisfiable = 416,
	ExpectationFailed = 417,
	ImATeapot = 418,
	MisdirectedRequest = 421,
	UnprocessableContent = 422,
	Locked = 423,
	FailedDependency = 424,
	TooEarly = 425,
	UpgradeRequired = 426,
	PreconditionRequired = 428,
	TooManyRequests = 429,
	RequestHeaderFieldsTooLarge = 431,
	UnavailableForLegalReasons = 451,
	InternalServerError = 500,
	NotImplemented = 501,
	BadGateway = 502,
	ServiceUnavailable = 503,
	GatewayTimeout = 504,
	HttpVersionNotSupported = 505,
	VariantAlsoNegotiates = 506,
	InsufficientStorage = 507,
	LoopDetected = 508,
	NotExtended = 510,
	NetworkAuthenticationRequired = 511,
}

export class TeardownError extends Error {
	code: ErrorCodes;

	constructor(code: ErrorCodes, message?: string) {
		super(message);
		this.code = code;
	}

	get status() {
		return this.code;
	}
}

export class ForbiddenError extends TeardownError {
	constructor(message = "Forbidden") {
		super(ErrorCodes.Forbidden, message);
	}
}

export class UnauthorizedError extends TeardownError {
	constructor(message = "Authorization required") {
		super(ErrorCodes.Unauthorized, message);
	}
}

export class BadRequestError extends TeardownError {
	constructor(message = "Bad request") {
		super(ErrorCodes.BadRequest, message);
	}
}

export class FailedRequestError extends TeardownError {
	constructor(message = "Failed request") {
		super(ErrorCodes.InternalServerError, message);
	}
}

export class NotFoundError extends TeardownError {
	constructor(message = "Not found") {
		super(ErrorCodes.NotFound, message);
	}
}

export class UnprocessableContentError extends TeardownError {
	constructor(message = "Unprocessable content") {
		super(ErrorCodes.UnprocessableContent, message);
	}
}

export class InternalServerError extends TeardownError {
	constructor(message = "Internal server error") {
		super(ErrorCodes.InternalServerError, message);
	}
}

export class ConflictError extends TeardownError {
	constructor(message = "Conflict") {
		super(ErrorCodes.Conflict, message);
	}
}

export class RateLimitError extends Error {
	constructor(
		public readonly resetTime: Date | null,
		public readonly remaining: number | null,
		public readonly limit: number | null,
		message = "Rate limit exceeded"
	) {
		super(message);
		this.name = "RateLimitError";
	}
}

export class ConfigurationError extends TeardownError {
	constructor(message = "Configuration not setup or is invalid") {
		super(ErrorCodes.InternalServerError, message);
	}
}

export interface ValidationErrorResponse {
	error: string;
	message: string;
	path?: string;
}

export interface ErrorResponse {
	success: false;
	error: string;
	message: string;
	path?: string;
	[key: string]: unknown;
}

export interface ErrorHandlerResult {
	status: number;
	body: ErrorResponse;
}

const handleValidationError = (error: unknown): ErrorHandlerResult => {
	const message = error instanceof Error ? error.message : "Validation failed";
	return {
		status: 422,
		body: {
			success: false,
			error: "VALIDATION",
			message: message || "Validation failed",
		},
	};
};

const handleValidCode = (parsedCode: number): ErrorHandlerResult => {
	return {
		status: parsedCode,
		body: {
			success: false,
			error: "Unknown error",
			message: "An unknown error occurred",
		},
	};
};

const handleZodError = (error: ZodError): ErrorHandlerResult => {
	const message = error instanceof Error ? error.message : "Validation failed";
	return {
		status: 400,
		body: {
			success: false,
			error: "Validation failed",
			message,
		},
	};
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex error handling logic that requires multiple conditional branches
export function handleError(error: unknown, code: number | string = 500): ErrorHandlerResult {
	// Handle Elysia ValidationError (duck-typed check)
	if (code === "VALIDATION" || (error && typeof error === "object" && "type" in error && error.type === "validation")) {
		return handleValidationError(error);
	}

	// Handle ZodError (duck-typed check for issues array)
	if (
		error instanceof ZodError &&
		error &&
		typeof error === "object" &&
		"issues" in error &&
		Array.isArray(error.issues)
	) {
		return handleZodError(error as ZodError);
	}

	if (error instanceof TeardownError) {
		return {
			status: error.status,
			body: {
				success: false,
				error: error.constructor.name,
				message: error.message,
			},
		};
	}

	// Handle JSON-encoded validation errors
	if (error && typeof error === "object" && "message" in error) {
		const errorWithMessage = error as { message: unknown };
		if (typeof errorWithMessage.message === "string") {
			try {
				const validationError = JSON.parse(errorWithMessage.message);
				if (validationError && Array.isArray(validationError) && validationError.length > 0) {
					const firstError = validationError[0];
					const path = firstError?.path?.join(".");
					return {
						status: 400,
						body: {
							success: false,
							error: "Validation failed",
							message: firstError?.message ?? "Invalid input",
							path: path && path.length > 0 ? path : undefined,
						},
					};
				}
			} catch {
				// Not a JSON validation error, continue
			}
		}
	}

	const parsedCode = Number(code);

	if (!Number.isNaN(parsedCode)) {
		return handleValidCode(parsedCode);
	}

	return {
		status: 500,
		body: {
			success: false,
			error: "Internal server error",
			message: "An unexpected error occurred",
		},
	};
}
