import { type Static, type TSchema, Type } from "@sinclair/typebox";

export const SuccessResponseSchema = <T extends TSchema>(dataSchema: T) =>
	Type.Object({
		success: Type.Literal(true),
		data: dataSchema,
	});

export const ErrorResponseSchema = Type.Object({
	success: Type.Literal(false),
	error: Type.Object({
		message: Type.String(),
		code: Type.Optional(Type.String()),
	}),
});

export type SuccessResponse<T> = {
	success: true;
	data: T;
};

export type ErrorResponse = Static<typeof ErrorResponseSchema>;

export const RequestResponseSchema = <Success extends TSchema>(successSchema: Success) =>
	Type.Union([SuccessResponseSchema(successSchema), ErrorResponseSchema]);
