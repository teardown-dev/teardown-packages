import type { AsyncResult } from "@teardown/types";
import type { ApiClient } from "../api";
import type { DeviceClient } from "../device/device.client";
import type { Logger, LoggingClient } from "../logging";

/**
 * Event payload for tracking events
 */
export interface EventPayload {
	/** Name of the event (e.g., "user_signed_out", "button_clicked") */
	event_name: string;
	/** Type of event */
	event_type?: "action" | "screen_view" | "custom";
	/** Additional properties to attach to the event */
	properties?: Record<string, unknown>;
	/** ISO timestamp. Defaults to current time if not provided */
	timestamp?: string;
}

/**
 * EventsClient - Universal client for sending events to the backend
 *
 * This client provides a centralized way to track events from anywhere in the SDK.
 * It automatically handles device ID retrieval and API communication.
 */
export class EventsClient {
	private readonly logger: Logger;

	constructor(
		logging: LoggingClient,
		private readonly api: ApiClient,
		private readonly device: DeviceClient
	) {
		this.logger = logging.createLogger({
			name: "EventsClient",
		});
	}

	/**
	 * Track a single event
	 * @param event - The event payload to track
	 * @param sessionId - Optional session ID to associate with the event
	 * @returns AsyncResult indicating success/failure
	 */
	async track(event: EventPayload, sessionId?: string): AsyncResult<void> {
		return this.trackBatch([event], sessionId);
	}

	/**
	 * Track multiple events in a single batch
	 * @param events - Array of event payloads to track
	 * @param sessionId - Optional session ID to associate with all events
	 * @returns AsyncResult indicating success/failure
	 */
	async trackBatch(events: EventPayload[], sessionId?: string): AsyncResult<void> {
		if (events.length === 0) {
			return { success: true, data: undefined };
		}

		this.logger.debug(`Tracking ${events.length} event(s)`, {
			eventNames: events.map((e) => e.event_name),
		});

		try {
			const deviceId = await this.device.getDeviceId();

			const response = await this.api.client("/v1/events", {
				method: "POST",
				headers: {
					"td-api-key": this.api.apiKey,
					"td-org-id": this.api.orgId,
					"td-project-id": this.api.projectId,
					"td-environment-slug": this.api.environmentSlug,
					"td-device-id": deviceId,
					...(sessionId ? { "td-session-id": sessionId } : {}),
				},
				body: {
					events: events.map((event) => ({
						event_name: event.event_name,
						event_type: event.event_type ?? "custom",
						properties: event.properties,
						timestamp: event.timestamp ?? new Date().toISOString(),
					})),
				},
			});

			if (response.error != null) {
				this.logger.warn("Failed to track events", { error: response.error });
				return { success: false, error: "Failed to track events" };
			}

			this.logger.debug(`Successfully tracked ${events.length} event(s)`);
			return { success: true, data: undefined };
		} catch (error) {
			this.logger.error("Error tracking events", { error });
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}
}
