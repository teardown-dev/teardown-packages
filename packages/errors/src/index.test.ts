import { describe, expect, it } from "bun:test";
import {
	BadRequestError,
	ErrorCodes,
	ForbiddenError,
	InternalServerError,
	NotFoundError,
	TeardownError,
	UnauthorizedError,
} from "./index";

describe("Errors", () => {
	describe("TeardownError", () => {
		it("should create error with code and message", () => {
			const error = new TeardownError(ErrorCodes.BadRequest, "Test error");

			expect(error.code).toBe(ErrorCodes.BadRequest);
			expect(error.message).toBe("Test error");
			expect(error.status).toBe(ErrorCodes.BadRequest);
		});

		it("should have status property matching code", () => {
			const error = new TeardownError(ErrorCodes.InternalServerError);

			expect(error.status).toBe(error.code);
			expect(error.status).toBe(500);
		});
	});

	describe("ForbiddenError", () => {
		it("should create error with default message", () => {
			const error = new ForbiddenError();

			expect(error.code).toBe(ErrorCodes.Forbidden);
			expect(error.message).toBe("Forbidden");
			expect(error.status).toBe(403);
		});

		it("should create error with custom message", () => {
			const error = new ForbiddenError("Custom forbidden message");

			expect(error.code).toBe(ErrorCodes.Forbidden);
			expect(error.message).toBe("Custom forbidden message");
		});
	});

	describe("UnauthorizedError", () => {
		it("should create error with default message", () => {
			const error = new UnauthorizedError();

			expect(error.code).toBe(ErrorCodes.Unauthorized);
			expect(error.message).toBe("Authorization required");
			expect(error.status).toBe(401);
		});

		it("should create error with custom message", () => {
			const error = new UnauthorizedError("Invalid credentials");

			expect(error.code).toBe(ErrorCodes.Unauthorized);
			expect(error.message).toBe("Invalid credentials");
		});
	});

	describe("BadRequestError", () => {
		it("should create error with default message", () => {
			const error = new BadRequestError();

			expect(error.code).toBe(ErrorCodes.BadRequest);
			expect(error.message).toBe("Bad request");
			expect(error.status).toBe(400);
		});

		it("should create error with custom message", () => {
			const error = new BadRequestError("Invalid input data");

			expect(error.code).toBe(ErrorCodes.BadRequest);
			expect(error.message).toBe("Invalid input data");
		});
	});

	describe("NotFoundError", () => {
		it("should create error with default message", () => {
			const error = new NotFoundError();

			expect(error.code).toBe(ErrorCodes.NotFound);
			expect(error.message).toBe("Not found");
			expect(error.status).toBe(404);
		});

		it("should create error with custom message", () => {
			const error = new NotFoundError("Resource not found");

			expect(error.code).toBe(ErrorCodes.NotFound);
			expect(error.message).toBe("Resource not found");
		});
	});

	describe("InternalServerError", () => {
		it("should create error with default message", () => {
			const error = new InternalServerError();

			expect(error.code).toBe(ErrorCodes.InternalServerError);
			expect(error.message).toBe("Internal server error");
			expect(error.status).toBe(500);
		});

		it("should create error with custom message", () => {
			const error = new InternalServerError("Database connection failed");

			expect(error.code).toBe(ErrorCodes.InternalServerError);
			expect(error.message).toBe("Database connection failed");
		});
	});

	describe("ErrorCodes enum", () => {
		it("should have correct status codes", () => {
			expect(ErrorCodes.OK).toBe(200);
			expect(ErrorCodes.Created).toBe(201);
			expect(ErrorCodes.Accepted).toBe(202);
			expect(ErrorCodes.BadRequest).toBe(400);
			expect(ErrorCodes.Unauthorized).toBe(401);
			expect(ErrorCodes.Forbidden).toBe(403);
			expect(ErrorCodes.NotFound).toBe(404);
			expect(ErrorCodes.UnprocessableContent).toBe(422);
			expect(ErrorCodes.TooManyRequests).toBe(429);
			expect(ErrorCodes.InternalServerError).toBe(500);
		});
	});
});
