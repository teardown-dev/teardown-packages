import { type Static, Type } from "@sinclair/typebox";
import { DevicePlatformEnum } from "@teardown/types";
import { EmailSchema } from "../../common";

export { DevicePlatformEnum };

/**
 * Application info schema
 */
export const ApplicationInfoSchema = Type.Object({
	version: Type.String({ error: "version is required" }),
	build_number: Type.Number({ error: "build_number is required" }),
});
export type ApplicationInfo = Static<typeof ApplicationInfoSchema>;

/**
 * OS info schema
 */
export const OSInfoSchema = Type.Object({
	/**
	 * Device platform
	 */
	platform: Type.Enum(DevicePlatformEnum, { error: "platform is required" }),
	/**
	 * OS name
	 */
	name: Type.String({ error: "name is required" }),
	/**
	 * OS version
	 */
	version: Type.String({ error: "version is required" }),
});
export type OSInfo = Static<typeof OSInfoSchema>;

/**
 * Hardware info schema
 */
export const HardwareInfoSchema = Type.Object({
	device_name: Type.String({ error: "device_name is required" }),
	device_type: Type.String({ error: "device_type is required" }),
	device_brand: Type.String({ error: "device_brand is required" }),
});
export type HardwareInfo = Static<typeof HardwareInfoSchema>;

export const EmergencyLaunchSchema = Type.Union([
	Type.Object({
		is_emergency_launch: Type.Literal(true),
		reason: Type.String({ error: "reason is required when is_emergency_launch is true" }),
	}),
	Type.Object({
		is_emergency_launch: Type.Literal(false),
		reason: Type.Optional(Type.Never()),
	}),
]);
export type EmergencyLaunch = Static<typeof EmergencyLaunchSchema>;

/**
 * Update info schema
 */
export const DeviceUpdateInfoSchema = Type.Object({
	is_enabled: Type.Boolean(),
	update_id: Type.String({ error: "update_id is required" }),
	update_channel: Type.String({ error: "update_channel is required" }),
	runtime_version: Type.String({ error: "runtime_version is required" }),
	emergency_launch: EmergencyLaunchSchema,
	is_embedded_launch: Type.Boolean({ error: "is_embedded_launch is required" }),
	created_at: Type.String(),
});
export type DeviceUpdateInfo = Static<typeof DeviceUpdateInfoSchema>;

export enum NotificationPlatformEnum {
	APNS = "APNS", // Apple Push Notification Service
	FCM = "FCM", // Firebase Cloud Messaging
	EXPO = "EXPO", // Expo Push Notifications
}

/**
 * Push notification info schema
 */
export const PushNotificationInfoSchema = Type.Object({
	enabled: Type.Boolean({ error: "enabled is required" }),
	granted: Type.Boolean({ error: "granted is required" }),
	token: Type.Union([Type.String({ error: "token is required" }), Type.Null()]),
	platform: Type.Enum(NotificationPlatformEnum, { error: "platform is required" }),
});
export type PushNotificationInfo = Static<typeof PushNotificationInfoSchema>;

export const NotificationsInfoSchema = Type.Object({
	push: PushNotificationInfoSchema,
});
export type NotificationsInfo = Static<typeof NotificationsInfoSchema>;

/**
 * Device info schema
 */
export const DeviceInfoSchema = Type.Object({
	/**
	 * Timestamp of collection on device (optional, generated server-side if not provided)
	 */
	timestamp: Type.Optional(Type.Date({ error: "timestamp is required" })),
	/**
	 * OS info, required
	 */
	os: OSInfoSchema,
	/**
	 * Application info, required
	 */
	application: ApplicationInfoSchema,
	/**
	 * Hardware info, required
	 */
	hardware: HardwareInfoSchema,
	/**
	 * Update info (optional) - not all builds will have an update
	 */
	update: Type.Union([DeviceUpdateInfoSchema, Type.Null()]),
	/**
	 * Notifications info (optional) - push notification token and permissions
	 */
	notifications: Type.Optional(NotificationsInfoSchema),
});
export type DeviceInfo = Static<typeof DeviceInfoSchema>;

/**
 * User info schema (optional fields)
 * Matches project_users table structure
 *
 * Supports both `persona_id` (preferred) and `user_id` (deprecated, for backwards compatibility).
 * If both are provided, `persona_id` takes precedence.
 */
export const UserInfoSchema = Type.Object({
	/**
	 * Your app's unique identifier for this user (preferred)
	 */
	persona_id: Type.Optional(Type.String({ error: "persona_id must be a string" })),
	/**
	 * @deprecated Use `persona_id` instead. Kept for backwards compatibility.
	 * Your app's unique identifier for this user
	 */
	user_id: Type.Optional(Type.String({ error: "user_id must be a string" })),
	email: Type.Optional(EmailSchema),
	name: Type.Optional(Type.String({ error: "name is required" })),
});
export type UserInfo = Static<typeof UserInfoSchema>;

/**
 * Resolves the effective user identifier from UserInfo.
 * Prefers persona_id over user_id for backwards compatibility.
 */
export function resolvePersonaId(userInfo: UserInfo | undefined): string | undefined {
	if (!userInfo) return undefined;
	return userInfo.persona_id ?? userInfo.user_id;
}

/** @deprecated Use UserInfoSchema instead */
export const PersonaInfoSchema = UserInfoSchema;
/** @deprecated Use UserInfo instead */
export type PersonaInfo = UserInfo;

/**
 * Identify request schema
 * Ties a device to a user with optional user data
 */
export const IdentifyRequestSchema = Type.Object({
	device: DeviceInfoSchema,
	user: Type.Optional(UserInfoSchema),
});
export type IdentifyRequest = Static<typeof IdentifyRequestSchema>;

export enum IdentifyVersionStatusEnum {
	/**
	 * A new version is available
	 */
	UPDATE_AVAILABLE = "UPDATE_AVAILABLE",
	/**
	 * An update is recommended
	 */
	UPDATE_RECOMMENDED = "UPDATE_RECOMMENDED",
	/**
	 * An update is required
	 */
	UPDATE_REQUIRED = "UPDATE_REQUIRED",
	/**
	 * The current version is valid & up to date
	 */
	UP_TO_DATE = "UP_TO_DATE",
	/**
	 * The version or build has been disabled
	 */
	DISABLED = "DISABLED",
}

export const UpdateInfoSchema = Type.Object({
	version: Type.String({ error: "version is required" }),
	build: Type.String({ error: "build is required" }),
	update_id: Type.String({ error: "update_id is required" }),
	effective_date: Type.Date({ error: "effective_date is required" }),
	release_notes: Type.Union([Type.String(), Type.Null()]),
});
export type UpdateInfo = Static<typeof UpdateInfoSchema>;

export const UpToDateInfoSchema = Type.Object({
	status: Type.Literal(IdentifyVersionStatusEnum.UP_TO_DATE),
	update: Type.Null(),
});
export type UpToDateInfo = Static<typeof UpToDateInfoSchema>;

export const UpdateRequiredInfoSchema = Type.Object({
	status: Type.Literal(IdentifyVersionStatusEnum.UPDATE_REQUIRED),
	update: UpdateInfoSchema,
});
export type UpdateRequiredInfo = Static<typeof UpdateRequiredInfoSchema>;

export const UpdateAvailableInfoSchema = Type.Object({
	status: Type.Literal(IdentifyVersionStatusEnum.UPDATE_AVAILABLE),
	update: UpdateInfoSchema,
});
export type UpdateAvailableInfo = Static<typeof UpdateAvailableInfoSchema>;

export const UpdateRecommendedInfoSchema = Type.Object({
	status: Type.Literal(IdentifyVersionStatusEnum.UPDATE_RECOMMENDED),
	update: UpdateInfoSchema,
});
export type UpdateRecommendedInfo = Static<typeof UpdateRecommendedInfoSchema>;

export const VersionInfoSchema = Type.Object({
	/**
	 * The status of the version
	 */
	status: Type.Enum(IdentifyVersionStatusEnum, { error: "status is required" }),
	update: Type.Union([UpdateInfoSchema, Type.Null()]),
});
export type VersionInfo = Static<typeof VersionInfoSchema>;

/**
 * Identify response schema
 */
export const IdentifyResponseSchema = Type.Object({
	success: Type.Literal(true),
	data: Type.Object({
		session_id: Type.String({ error: "session_id is required" }),
		device_id: Type.String({ error: "device_id is required" }),
		user_id: Type.String({ error: "user_id is required" }),
		token: Type.String({ error: "token is required" }), // JWT token for session authentication
		version_info: VersionInfoSchema,
	}),
});
export type IdentifyResponse = Static<typeof IdentifyResponseSchema>;

export const IdentifyErrorResponseSchema = Type.Object({
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
			code: Type.Literal("IDENTIFY_FAILED"),
			message: Type.String(),
		}),
		Type.Object({
			code: Type.Literal("NO_SESSION_ID_GENERATED"),
			message: Type.String(),
		}),
		Type.Object({
			code: Type.Literal("NO_DEVICE_ID_GENERATED"),
			message: Type.String(),
		}),
		Type.Object({
			code: Type.Literal("NO_USER_ID_GENERATED"),
			message: Type.String(),
		}),
	]),
});
export type IdentifyErrorResponse = Static<typeof IdentifyErrorResponseSchema>;

export const ValidationErrorSchema = Type.Object({
	success: Type.Literal(false),
	error: Type.Literal("VALIDATION"),
	message: Type.String(),
});
