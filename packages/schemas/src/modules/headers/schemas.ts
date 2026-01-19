import { type Static, Type } from "@sinclair/typebox";

/**
 * SDK Info schema
 * Represents parsed SDK version header information
 */
export const SdkInfoSchema = Type.Object({
	sdkName: Type.Union([Type.String(), Type.Null()]),
	sdkVersion: Type.Union([Type.String(), Type.Null()]),
});
export type SdkInfo = Static<typeof SdkInfoSchema>;

/**
 * Identify headers schema
 * Headers required for the identify endpoint
 */
export const IdentifyHeadersSchema = Type.Object({
	orgId: Type.String({ error: "orgId is required" }),
	projectId: Type.String({ error: "projectId is required" }),
	environmentSlug: Type.String({ error: "environmentSlug is required" }),
	deviceId: Type.String({ error: "deviceId is required" }),
	sessionId: Type.Union([Type.String(), Type.Null()]),
	sdk: SdkInfoSchema,
});
export type IdentifyHeaders = Static<typeof IdentifyHeadersSchema>;

/**
 * Events headers schema
 * Headers required for the events endpoint
 */
export const EventsHeadersSchema = Type.Object({
	orgId: Type.String({ error: "orgId is required" }),
	projectId: Type.String({ error: "projectId is required" }),
	environmentSlug: Type.String({ error: "environmentSlug is required" }),
	deviceId: Type.Union([Type.String(), Type.Null()]),
	sessionId: Type.Union([Type.String(), Type.Null()]),
});
export type EventsHeaders = Static<typeof EventsHeadersSchema>;

/**
 * Header error codes
 */
export const HeaderErrorCodeSchema = Type.Union([
	Type.Literal("MISSING_DEVICE_ID"),
	Type.Literal("MISSING_ENVIRONMENT_SLUG"),
	Type.Literal("MISSING_ORG_ID"),
	Type.Literal("MISSING_PROJECT_ID"),
]);
export type HeaderErrorCode = Static<typeof HeaderErrorCodeSchema>;

/**
 * Parses SDK version header in format "@package/name@version" or "name@version"
 * @param sdkVersionHeader - The td-sdk-version header value (e.g., "@teardown/sdk@0.0.2")
 * @returns Parsed SDK name and version, or nulls if not provided/parseable
 */
export function parseSdkVersionHeader(sdkVersionHeader: string | undefined): SdkInfo {
	if (!sdkVersionHeader) {
		return { sdkName: null, sdkVersion: null };
	}

	// Handle scoped packages like "@teardown/sdk@0.0.2"
	// Find the last @ which separates name from version
	const lastAtIndex = sdkVersionHeader.lastIndexOf("@");

	// If no @ found or @ is at the start (just scoped name without version), return as-is
	if (lastAtIndex <= 0) {
		return { sdkName: sdkVersionHeader, sdkVersion: null };
	}

	const sdkName = sdkVersionHeader.slice(0, lastAtIndex);
	const sdkVersion = sdkVersionHeader.slice(lastAtIndex + 1);

	return {
		sdkName: sdkName || null,
		sdkVersion: sdkVersion || null,
	};
}
