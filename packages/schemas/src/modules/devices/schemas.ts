import { type Static, Type } from "@sinclair/typebox";
import { DevicePlatformEnum } from "@teardown/types";
import type { AssertSchemaCompatibleWithRow, AssertTrue } from "../../common";

/**
 * Device platform enum matching database
 */

/**
 * Device platform
 */
export const DevicePlatformSchema = Type.Enum(DevicePlatformEnum, { error: "platform is required" });
export type DevicePlatform = Static<typeof DevicePlatformSchema>;

/**
 * Parse and validate a DevicePlatformEnum value
 * Uses a switch statement to ensure type safety and runtime validation
 * @param value - The value to parse
 * @returns The validated DevicePlatformEnum value or null
 * @throws Error if the value is not a valid DevicePlatformEnum and not null
 */
export function parseDevicePlatformEnum(value: unknown): DevicePlatformEnum | null {
	if (value === null || value === undefined) {
		return null;
	}
	switch (value) {
		case DevicePlatformEnum.IOS:
			return DevicePlatformEnum.IOS;
		case DevicePlatformEnum.ANDROID:
			return DevicePlatformEnum.ANDROID;
		case DevicePlatformEnum.WEB:
			return DevicePlatformEnum.WEB;
		case DevicePlatformEnum.WINDOWS:
			return DevicePlatformEnum.WINDOWS;
		case DevicePlatformEnum.MACOS:
			return DevicePlatformEnum.MACOS;
		case DevicePlatformEnum.LINUX:
			return DevicePlatformEnum.LINUX;
		case DevicePlatformEnum.PHONE:
			return DevicePlatformEnum.PHONE;
		case DevicePlatformEnum.TABLET:
			return DevicePlatformEnum.TABLET;
		case DevicePlatformEnum.DESKTOP:
			return DevicePlatformEnum.DESKTOP;
		case DevicePlatformEnum.CONSOLE:
			return DevicePlatformEnum.CONSOLE;
		case DevicePlatformEnum.TV:
			return DevicePlatformEnum.TV;
		case DevicePlatformEnum.WEARABLE:
			return DevicePlatformEnum.WEARABLE;
		case DevicePlatformEnum.GAME_CONSOLE:
			return DevicePlatformEnum.GAME_CONSOLE;
		case DevicePlatformEnum.VR:
			return DevicePlatformEnum.VR;
		case DevicePlatformEnum.UNKNOWN:
			return DevicePlatformEnum.UNKNOWN;
		case DevicePlatformEnum.OTHER:
			return DevicePlatformEnum.OTHER;
		default:
			throw new Error(
				`Invalid DevicePlatformEnum value: ${value}. Expected one of: ${Object.values(DevicePlatformEnum).join(", ")}`
			);
	}
}

/**
 * Base device schema
 * Represents devices table structure
 */
export const DeviceSchema = Type.Object({
	id: Type.String({ format: "uuid" }),
	user_id: Type.String({ format: "uuid" }),
	environment_id: Type.Union([Type.String({ format: "uuid" }), Type.Null()]),
	device_id: Type.String(),
	platform: Type.Union([DevicePlatformSchema, Type.Null()]),
	os_type: Type.Union([Type.String(), Type.Null()]),
	os_name: Type.Union([Type.String(), Type.Null()]),
	device_name: Type.Union([Type.String(), Type.Null()]),
	device_brand: Type.Union([Type.String(), Type.Null()]),
	metadata: Type.Union([Type.Record(Type.String(), Type.Unknown()), Type.Null()]),
	created_at: Type.String(),
	updated_at: Type.String(),
});
export type Device = Static<typeof DeviceSchema>;

/**
 * Device params schema
 */
export const DeviceParamsSchema = Type.Object({
	device_id: Type.String({ format: "uuid" }),
});
export type DeviceParams = Static<typeof DeviceParamsSchema>;

/**
 * Search devices query schema
 * Supports pagination, search, and sorting
 */
export const SearchDevicesQuerySchema = Type.Object({
	project_id: Type.String({ format: "uuid" }),
	page: Type.Number({ minimum: 1, default: 1 }),
	limit: Type.Number({ minimum: 1, maximum: 100, default: 20 }),
	search: Type.Optional(Type.String()),
	sort_by: Type.Union(
		[
			Type.Literal("created_at"),
			Type.Literal("updated_at"),
			Type.Literal("device_name"),
			Type.Literal("platform"),
			Type.Literal("os_name"),
		],
		{ default: "created_at" }
	),
	sort_order: Type.Union([Type.Literal("asc"), Type.Literal("desc")], { default: "desc" }),
});
export type SearchDevicesQuery = Static<typeof SearchDevicesQuerySchema>;

/**
 * Search devices query schema without project_id (injected from headers)
 */
export const SearchDevicesQueryParamsSchema = Type.Omit(SearchDevicesQuerySchema, ["project_id"]);
export type SearchDevicesQueryParams = Static<typeof SearchDevicesQueryParamsSchema>;

/**
 * Devices by IDs request schema
 */
export const DevicesByIdsSchema = Type.Object({
	device_ids: Type.Array(Type.String({ format: "uuid" }), { minItems: 1, maxItems: 100 }),
});
export type DevicesByIds = Static<typeof DevicesByIdsSchema>;

/**
 * Paginated devices response schema
 */
export const DevicesResponseSchema = Type.Object({
	devices: Type.Array(DeviceSchema),
	pagination: Type.Object({
		page: Type.Integer({ minimum: 1 }),
		limit: Type.Integer({ minimum: 1 }),
		total: Type.Integer({ minimum: 0 }),
		total_pages: Type.Integer({ minimum: 0 }),
	}),
});
export type DevicesResponse = Static<typeof DevicesResponseSchema>;

/**
 * Single device response schema
 */
export const DeviceResponseSchema = Type.Object({
	success: Type.Literal(true),
	data: DeviceSchema,
});
export type DeviceResponse = Static<typeof DeviceResponseSchema>;

/**
 * Device error response schema
 * Discriminated union by error code
 */
export const DeviceErrorSchema = Type.Union([
	Type.Object({
		code: Type.Literal("DEVICE_NOT_FOUND"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("PROJECT_NOT_FOUND"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("FORBIDDEN"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("FETCH_FAILED"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("INVALID_PARAMS"),
		message: Type.String(),
	}),
]);
export type DeviceError = Static<typeof DeviceErrorSchema>;

/**
 * Device error response wrapper
 */
export const DeviceErrorResponseSchema = Type.Object({
	success: Type.Literal(false),
	error: DeviceErrorSchema,
});
export type DeviceErrorResponse = Static<typeof DeviceErrorResponseSchema>;

/**
 * Device request response schema
 */
export const DeviceRequestResponseSchema = Type.Union([DeviceResponseSchema, DeviceErrorResponseSchema]);
export type DeviceRequestResponse = Static<typeof DeviceRequestResponseSchema>;
export type _CheckDeviceRow = AssertTrue<AssertSchemaCompatibleWithRow<Device, "devices">>;
