/**
 * Ingest API client using openapi-fetch.
 * Type-safe client generated from OpenAPI schema.
 */
import createClient, { type FetchOptions } from "openapi-fetch";
import type { components, paths } from "../../generated/openapi";

/** Client configuration options */
export interface ClientConfig {
	baseUrl?: string;
	headers?: Record<string, string>;
}

/** Create a type-safe client for the Ingest API */
export function createIngestClient(config?: ClientConfig) {
	return createClient<paths>({
		baseUrl: config?.baseUrl ?? "https://ingest.teardown.dev",
		headers: config?.headers,
	});
}

/** Ingest API client type */
export type IngestClient = ReturnType<typeof createIngestClient>;

/** Re-export schema types for consumers */
export type { paths, components };

/** Convenience type exports from components */
export type Device = components["schemas"]["Device"];
export type DeviceOS = components["schemas"]["DeviceOS"];
export type DeviceApplication = components["schemas"]["DeviceApplication"];
export type DeviceHardware = components["schemas"]["DeviceHardware"];
export type DeviceUpdate = components["schemas"]["DeviceUpdate"];
export type DeviceNotifications = components["schemas"]["DeviceNotifications"];
export type DevicePlatform = components["schemas"]["DevicePlatform"];
export type NotificationPlatform = components["schemas"]["NotificationPlatform"];
export type User = components["schemas"]["User"];
export type IdentifyRequest = components["schemas"]["IdentifyRequest"];
export type IdentifyResponse = components["schemas"]["IdentifyResponse"];
export type IdentifyResponseData = components["schemas"]["IdentifyResponseData"];
export type IdentifyError = components["schemas"]["IdentifyError"];
export type IdentifyErrorCode = components["schemas"]["IdentifyErrorCode"];
export type IdentifyVersionStatus = components["schemas"]["IdentifyVersionStatus"];
export type VersionInfo = components["schemas"]["VersionInfo"];
export type VersionUpdate = components["schemas"]["VersionUpdate"];
export type Event = components["schemas"]["Event"];
export type EventsRequest = components["schemas"]["EventsRequest"];
export type EventsResponse = components["schemas"]["EventsResponse"];
export type EventsResponseData = components["schemas"]["EventsResponseData"];
export type EventsError = components["schemas"]["EventsError"];
export type EventsErrorCode = components["schemas"]["EventsErrorCode"];
export type ValidationError = components["schemas"]["ValidationError"];

/** All endpoint paths */
export type Endpoints = keyof paths;

/** Request options type (for backward compatibility) */
export type RequestOptions = FetchOptions<paths[keyof paths]>;

/** Legacy alias - use createIngestClient instead */
export const client = createIngestClient;

/** Legacy type alias */
export type Client = IngestClient;
