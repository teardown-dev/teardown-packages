import { type Static, Type } from "@sinclair/typebox";

export const UUIDSchema = Type.String({ format: "uuid", error: "Invalid UUID" });
export const SlugSchema = Type.String({ pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", error: "Invalid slug" });

export const URLSchema = Type.String({ format: "uri", error: "Invalid URL" });
export const TimestampSchema = Type.String({ format: "date-time", error: "Invalid timestamp" });

export type UUID = Static<typeof UUIDSchema>;
export type Slug = Static<typeof SlugSchema>;
export type URL = Static<typeof URLSchema>;
export type Timestamp = Static<typeof TimestampSchema>;

export const EmailSchema = Type.Transform(
	Type.Optional(
		Type.Union([Type.String({ format: "email", error: "Invalid email address" }), Type.Literal(""), Type.Undefined()])
	)
)
	.Decode((value) => (value === "" ? undefined : value))
	.Encode((value) => value ?? "");
export type Email = Static<typeof EmailSchema>;
