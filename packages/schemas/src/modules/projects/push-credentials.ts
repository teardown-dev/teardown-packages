import { type Static, Type } from "@sinclair/typebox";

/**
 * FCM Service Account JSON input schema
 * Validates the structure of a Google Cloud service account JSON
 */
export const FcmCredentialsInputSchema = Type.Object({
	type: Type.Literal("service_account"),
	project_id: Type.String({ minLength: 1 }),
	private_key_id: Type.String({ minLength: 1 }),
	private_key: Type.String({ minLength: 1 }),
	client_email: Type.String({ format: "email" }),
	client_id: Type.String({ minLength: 1 }),
	auth_uri: Type.String({ format: "uri" }),
	token_uri: Type.String({ format: "uri" }),
	auth_provider_x509_cert_url: Type.Optional(Type.String({ format: "uri" })),
	client_x509_cert_url: Type.Optional(Type.String({ format: "uri" })),
	universe_domain: Type.Optional(Type.String()),
});
export type FcmCredentialsInput = Static<typeof FcmCredentialsInputSchema>;

/**
 * APNS credentials input schema
 * key_id: 10-character Key ID from Apple Developer
 * team_id: 10-character Team ID from Apple Developer
 * bundle_id: iOS app bundle identifier
 * key: .p8 key file content
 */
export const ApnsCredentialsInputSchema = Type.Object({
	key_id: Type.String({ minLength: 10, maxLength: 10 }),
	team_id: Type.String({ minLength: 10, maxLength: 10 }),
	bundle_id: Type.String({ minLength: 1 }),
	key: Type.String({ minLength: 1 }), // .p8 file content
});
export type ApnsCredentialsInput = Static<typeof ApnsCredentialsInputSchema>;

/**
 * Request schema for saving FCM credentials
 */
export const SaveFcmCredentialsBodySchema = Type.Object({
	credentials: FcmCredentialsInputSchema,
});
export type SaveFcmCredentialsBody = Static<typeof SaveFcmCredentialsBodySchema>;

/**
 * Request schema for saving APNS credentials
 */
export const SaveApnsCredentialsBodySchema = Type.Object({
	credentials: ApnsCredentialsInputSchema,
});
export type SaveApnsCredentialsBody = Static<typeof SaveApnsCredentialsBodySchema>;

/**
 * Masked FCM credentials for dashboard display
 * Never exposes the actual private key
 */
export const FcmCredentialsMaskedSchema = Type.Object({
	configured: Type.Literal(true),
	project_id: Type.String(),
	client_email_masked: Type.String(), // e.g. "****@project.iam.gserviceaccount.com"
});
export type FcmCredentialsMasked = Static<typeof FcmCredentialsMaskedSchema>;

/**
 * Masked APNS credentials for dashboard display
 */
export const ApnsCredentialsMaskedSchema = Type.Object({
	configured: Type.Literal(true),
	key_id: Type.String(),
	team_id: Type.String(),
	bundle_id: Type.String(),
});
export type ApnsCredentialsMasked = Static<typeof ApnsCredentialsMaskedSchema>;

/**
 * Not configured state for credentials
 */
export const CredentialsNotConfiguredSchema = Type.Object({
	configured: Type.Literal(false),
});
export type CredentialsNotConfigured = Static<typeof CredentialsNotConfiguredSchema>;

/**
 * Push credentials status response
 * Shows masked status of FCM and APNS configuration
 */
export const PushCredentialsStatusSchema = Type.Object({
	fcm: Type.Union([FcmCredentialsMaskedSchema, CredentialsNotConfiguredSchema]),
	apns: Type.Union([ApnsCredentialsMaskedSchema, CredentialsNotConfiguredSchema]),
});
export type PushCredentialsStatus = Static<typeof PushCredentialsStatusSchema>;

/**
 * Push credentials status response wrapper
 */
export const PushCredentialsStatusResponseSchema = Type.Object({
	success: Type.Literal(true),
	data: PushCredentialsStatusSchema,
});
export type PushCredentialsStatusResponse = Static<typeof PushCredentialsStatusResponseSchema>;

/**
 * Push credentials error codes
 */
export const PushCredentialsErrorSchema = Type.Union([
	Type.Object({
		code: Type.Literal("PROJECT_NOT_FOUND"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("ENCRYPTION_NOT_CONFIGURED"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("INVALID_CREDENTIALS"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("SAVE_FAILED"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("DELETE_FAILED"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("FETCH_FAILED"),
		message: Type.String(),
	}),
]);
export type PushCredentialsError = Static<typeof PushCredentialsErrorSchema>;

/**
 * Push credentials error response wrapper
 */
export const PushCredentialsErrorResponseSchema = Type.Object({
	success: Type.Literal(false),
	error: PushCredentialsErrorSchema,
});
export type PushCredentialsErrorResponse = Static<typeof PushCredentialsErrorResponseSchema>;

/**
 * Success response for credential save/delete operations
 */
export const PushCredentialsSuccessResponseSchema = Type.Object({
	success: Type.Literal(true),
});
export type PushCredentialsSuccessResponse = Static<typeof PushCredentialsSuccessResponseSchema>;
