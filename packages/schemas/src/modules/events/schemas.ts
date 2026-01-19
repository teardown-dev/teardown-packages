import { type Static, Type } from "@sinclair/typebox";
import type { AssertSchemaCompatibleWithRow, AssertTrue } from "../../common";

/**
 * Event type enum
 */
export const EventTypeEnum = ["action", "screen_view", "custom"] as const;
export type EventType = (typeof EventTypeEnum)[number];

/**
 * Single event schema
 */
export const EventSchema = Type.Object({
	/**
	 * Name of the event (required)
	 */
	event_name: Type.String({ minLength: 1, error: "event_name is required" }),
	/**
	 * Type of event
	 */
	event_type: Type.Union([Type.Literal("action"), Type.Literal("screen_view"), Type.Literal("custom")], {
		default: "custom",
	}),
	/**
	 * Custom properties for the event (optional)
	 */
	properties: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
	/**
	 * Client-side timestamp (optional, defaults to server time)
	 */
	timestamp: Type.Optional(Type.String()),
	/**
	 * Session ID (optional, can come from header)
	 */
	session_id: Type.Optional(Type.String({ format: "uuid" })),
	/**
	 * Device ID (optional, can come from header)
	 */
	device_id: Type.Optional(Type.String()),
});
export type Event = Static<typeof EventSchema>;

/**
 * Batch events request schema
 * Accepts 1-100 events per request
 */
export const EventsRequestSchema = Type.Object({
	/**
	 * Array of events to ingest (1-100)
	 */
	events: Type.Array(EventSchema, { minItems: 1, maxItems: 100, error: "At least one event is required, maximum 100" }),
	/**
	 * Session ID (optional, applies to all events if not specified per-event)
	 */
	session_id: Type.Optional(Type.String({ format: "uuid" })),
	/**
	 * Device ID (optional, applies to all events if not specified per-event)
	 */
	device_id: Type.Optional(Type.String()),
});
export type EventsRequest = Static<typeof EventsRequestSchema>;

/**
 * Events response schema
 */
export const EventsResponseSchema = Type.Object({
	success: Type.Literal(true),
	data: Type.Object({
		/**
		 * IDs of created events
		 */
		event_ids: Type.Array(Type.String()),
		/**
		 * Number of successfully processed events
		 */
		processed_count: Type.Number(),
		/**
		 * Number of failed events
		 */
		failed_count: Type.Number(),
	}),
});
export type EventsResponse = Static<typeof EventsResponseSchema>;

/**
 * Events error response schema
 */
export const EventsErrorResponseSchema = Type.Object({
	success: Type.Literal(false),
	error: Type.Union([
		Type.Object({
			code: Type.Literal("MISSING_ORG_ID"),
			message: Type.String(),
		}),
		Type.Object({
			code: Type.Literal("MISSING_PROJECT_ID"),
			message: Type.String(),
		}),
		Type.Object({
			code: Type.Literal("MISSING_ENVIRONMENT_SLUG"),
			message: Type.String(),
		}),
		Type.Object({
			code: Type.Literal("MISSING_DEVICE_ID"),
			message: Type.String(),
		}),
		Type.Object({
			code: Type.Literal("EVENTS_PROCESSING_FAILED"),
			message: Type.String(),
		}),
		Type.Object({
			code: Type.Literal("INVALID_SESSION"),
			message: Type.String(),
		}),
		Type.Object({
			code: Type.Literal("INVALID_DEVICE"),
			message: Type.String(),
		}),
		Type.Object({
			code: Type.Literal("BATCH_SIZE_EXCEEDED"),
			message: Type.String(),
		}),
		Type.Object({
			code: Type.Literal("VALIDATION_ERROR"),
			message: Type.String(),
		}),
	]),
});
export type EventsErrorResponse = Static<typeof EventsErrorResponseSchema>;

export type _CheckEventRow = AssertTrue<AssertSchemaCompatibleWithRow<Event, "events">>;
