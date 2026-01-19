import { type Static, Type } from "@sinclair/typebox";
import { OrgInvitationWithOrgSchema, OrgRoleWithOrgSchema } from "../orgs/schemas";

/**
 * User schema
 * Represents Supabase Auth user structure
 */
export const UserSchema = Type.Object({
	id: Type.String({ format: "uuid" }),
	email: Type.Optional(Type.String({ format: "email" })),
	app_metadata: Type.Record(Type.String(), Type.Unknown()),
	user_metadata: Type.Record(Type.String(), Type.Unknown()),
	created_at: Type.String(),
	is_system_admin: Type.Boolean(),

	// id: string
	// app_metadata: UserAppMetadata
	// user_metadata: UserMetadata
	// aud: string
	// confirmation_sent_at?: string
	// recovery_sent_at?: string
	// email_change_sent_at?: string
	// new_email?: string
	// new_phone?: string
	// invited_at?: string
	// action_link?: string
	// email?: string
	// phone?: string
	// created_at: string
	// confirmed_at?: string
	// email_confirmed_at?: string
	// phone_confirmed_at?: string
	// last_sign_in_at?: string
	// role?: string
	// updated_at?: string
	// identities?: UserIdentity[]
	// is_anonymous?: boolean
	// is_sso_user?: boolean
	// factors?: (Factor<FactorType, 'verified'> | Factor<FactorType, 'unverified'>)[]
	// deleted_at?: string
});
export type User = Static<typeof UserSchema>;

/**
 * Me response schema
 */
export const MeResponseSchema = Type.Object({
	user: UserSchema,
});
export type MeResponse = Static<typeof MeResponseSchema>;

/**
 * Me orgs response schema
 * Reuses OrgRoleWithOrgSchema from orgs module
 */
export const MeOrgsResponseSchema = Type.Object({
	orgs: Type.Array(OrgRoleWithOrgSchema),
});
export type MeOrgsResponse = Static<typeof MeOrgsResponseSchema>;

/**
 * Me error response schema
 * Discriminated union by error code
 */
export const MeErrorSchema = Type.Union([
	Type.Object({
		code: Type.Literal("UNAUTHORIZED"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("USER_NOT_FOUND"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("FETCH_FAILED"),
		message: Type.String(),
	}),
]);
export type MeError = Static<typeof MeErrorSchema>;

/**
 * Me error response wrapper
 */
export const MeErrorResponseSchema = Type.Object({
	success: Type.Literal(false),
	error: MeErrorSchema,
});
export type MeErrorResponse = Static<typeof MeErrorResponseSchema>;

/**
 * Me invitations response schema
 * Returns pending invitations for the current user
 */
export const MeInvitationsResponseSchema = Type.Object({
	invitations: Type.Array(OrgInvitationWithOrgSchema),
});
export type MeInvitationsResponse = Static<typeof MeInvitationsResponseSchema>;

/**
 * Accept invitation response schema
 */
export const AcceptInvitationResponseSchema = Type.Object({
	success: Type.Literal(true),
	data: Type.Object({
		membership: OrgRoleWithOrgSchema,
	}),
});
export type AcceptInvitationResponse = Static<typeof AcceptInvitationResponseSchema>;

/**
 * Decline invitation response schema
 */
export const DeclineInvitationResponseSchema = Type.Object({
	success: Type.Literal(true),
});
export type DeclineInvitationResponse = Static<typeof DeclineInvitationResponseSchema>;
