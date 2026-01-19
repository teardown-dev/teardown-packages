import { type Static, Type } from "@sinclair/typebox";
import { OrgInvitationStatusEnum, OrgRoleTypeEnum, OrgTypeEnum } from "@teardown/types";
import {
	type AssertSchemaCompatibleWithInsert,
	type AssertSchemaCompatibleWithRow,
	type AssertSchemaCompatibleWithUpdate,
	type AssertTrue,
	SlugSchema,
} from "../../common";

export const OrgHeadersSchema = Type.Object({
	"td-org-id": Type.String(),
});
export type OrgHeaders = Static<typeof OrgHeadersSchema>;

/**
 * Helper to check if role is admin or owner
 */
export function isAdminRole(role: string): boolean {
	return role === OrgRoleTypeEnum.OWNER || role === OrgRoleTypeEnum.ADMIN;
}

/**
 * Helper to check if role is owner
 */
export function isOwnerRole(role: string): boolean {
	return role === OrgRoleTypeEnum.OWNER;
}

/**
 * Parse and validate an OrgRoleTypeEnum value
 * Uses a switch statement to ensure type safety and runtime validation
 * @param value - The value to parse
 * @returns The validated OrgRoleTypeEnum value
 * @throws Error if the value is not a valid OrgRoleTypeEnum
 */
export function parseOrgRoleTypeEnum(value: unknown): OrgRoleTypeEnum {
	switch (value) {
		case OrgRoleTypeEnum.OWNER:
			return OrgRoleTypeEnum.OWNER;
		case OrgRoleTypeEnum.ADMIN:
			return OrgRoleTypeEnum.ADMIN;
		case OrgRoleTypeEnum.ENGINEER:
			return OrgRoleTypeEnum.ENGINEER;
		default:
			throw new Error(
				`Invalid OrgRoleTypeEnum value: ${value}. Expected one of: ${Object.values(OrgRoleTypeEnum).join(", ")}`
			);
	}
}

/**
 * Parse and validate an OrgTypeEnum value
 * Uses a switch statement to ensure type safety and runtime validation
 * @param value - The value to parse
 * @returns The validated OrgTypeEnum value
 * @throws Error if the value is not a valid OrgTypeEnum
 */
export function parseOrgTypeEnum(value: unknown): OrgTypeEnum {
	switch (value) {
		case OrgTypeEnum.PERSONAL:
			return OrgTypeEnum.PERSONAL;
		case OrgTypeEnum.START_UP:
			return OrgTypeEnum.START_UP;
		case OrgTypeEnum.SCALE_UP:
			return OrgTypeEnum.SCALE_UP;
		case OrgTypeEnum.AGENCY:
			return OrgTypeEnum.AGENCY;
		case OrgTypeEnum.ENTERPRISE:
			return OrgTypeEnum.ENTERPRISE;
		default:
			throw new Error(`Invalid OrgTypeEnum value: ${value}. Expected one of: ${Object.values(OrgTypeEnum).join(", ")}`);
	}
}

export const OrgSlugOrIdParamsSchema = Type.Object({
	org_id_or_slug: Type.String(),
});
export type OrgSlugOrIdParams = Static<typeof OrgSlugOrIdParamsSchema>;

export const OrgIdParamsSchema = Type.Object({
	org_id: Type.String(),
});
export type OrgIdParams = Static<typeof OrgIdParamsSchema>;

export const OrgSlugParamsSchema = Type.Object({
	// org_slug: SlugSchema,
});
export type OrgSlugParams = Static<typeof OrgSlugParamsSchema>;

/**
 * Base org schema
 * Represents organisation table structure
 */
export const OrgSchema = Type.Object({
	id: Type.String({ format: "uuid" }),
	name: Type.String({ minLength: 1 }),
	slug: SlugSchema,
	type: Type.Enum(OrgTypeEnum),
	created_at: Type.String(),
	updated_at: Type.String(),
});
export type Org = Static<typeof OrgSchema>;

/**
 * Org role schema
 * Represents organisation_role table structure
 */
export const OrgRoleSchema = Type.Object({
	id: Type.String({ format: "uuid" }),
	org_id: Type.String({ format: "uuid" }),
	user_id: Type.String({ format: "uuid" }),
	role: Type.Enum(OrgRoleTypeEnum),
	created_at: Type.String(),
	updated_at: Type.String(),
});
export type OrgRole = Static<typeof OrgRoleSchema>;

/**
 * Extended org role with org name
 * Used for user's org list
 */
export const OrgRoleWithOrgSchema = Type.Composite([
	OrgRoleSchema,
	Type.Object({
		org_id: Type.String({ format: "uuid" }),
		org_name: Type.String(),
		org_slug: SlugSchema,
	}),
]);
export type OrgRoleWithOrg = Static<typeof OrgRoleWithOrgSchema>;

/**
 * Create org request schema
 */
export const CreateOrgSchema = Type.Object({
	name: Type.String({ minLength: 1, maxLength: 255 }),
	slug: SlugSchema,
	type: Type.Enum(OrgTypeEnum),
});
export type CreateOrg = Static<typeof CreateOrgSchema>;

/**
 * Update org request schema
 */
export const UpdateOrgSchema = Type.Object({
	name: Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
});
export type UpdateOrg = Static<typeof UpdateOrgSchema>;

/**
 * Add org role request schema
 */
export const AddOrgRoleSchema = Type.Object({
	org_id: Type.String({ format: "uuid" }),
	user_id: Type.String({ format: "uuid" }),
	role: Type.Enum(OrgRoleTypeEnum),
});
export type AddOrgRole = Static<typeof AddOrgRoleSchema>;

/**
 * Org invitation schema
 * Represents org_invitations table structure
 */
export const OrgInvitationSchema = Type.Object({
	id: Type.String({ format: "uuid" }),
	org_id: Type.String({ format: "uuid" }),
	email: Type.String({ format: "email" }),
	role: Type.Enum(OrgRoleTypeEnum),
	status: Type.Enum(OrgInvitationStatusEnum),
	invited_by: Type.String({ format: "uuid" }),
	expires_at: Type.String(),
	created_at: Type.String(),
	updated_at: Type.String(),
});
export type OrgInvitation = Static<typeof OrgInvitationSchema>;

/**
 * Org invitation with org info schema
 * Used for displaying pending invitations to users
 */
export const OrgInvitationWithOrgSchema = Type.Composite([
	OrgInvitationSchema,
	Type.Object({
		org_name: Type.String(),
		org_slug: SlugSchema,
	}),
]);
export type OrgInvitationWithOrg = Static<typeof OrgInvitationWithOrgSchema>;

/**
 * Parse and validate an OrgInvitationStatusEnum value
 */
export function parseOrgInvitationStatusEnum(value: unknown): OrgInvitationStatusEnum {
	switch (value) {
		case OrgInvitationStatusEnum.PENDING:
			return OrgInvitationStatusEnum.PENDING;
		case OrgInvitationStatusEnum.ACCEPTED:
			return OrgInvitationStatusEnum.ACCEPTED;
		case OrgInvitationStatusEnum.CANCELLED:
			return OrgInvitationStatusEnum.CANCELLED;
		case OrgInvitationStatusEnum.EXPIRED:
			return OrgInvitationStatusEnum.EXPIRED;
		default:
			throw new Error(
				`Invalid OrgInvitationStatusEnum value: ${value}. Expected one of: ${Object.values(OrgInvitationStatusEnum).join(", ")}`
			);
	}
}

/**
 * Create org invitation request schema
 */
export const CreateOrgInvitationSchema = Type.Object({
	email: Type.String({ format: "email" }),
	role: Type.Enum(OrgRoleTypeEnum),
});
export type CreateOrgInvitation = Static<typeof CreateOrgInvitationSchema>;

/**
 * Org member with user info schema
 * Used for displaying members in the UI
 */
export const OrgMemberSchema = Type.Object({
	id: Type.String({ format: "uuid" }),
	user_id: Type.String({ format: "uuid" }),
	role: Type.Enum(OrgRoleTypeEnum),
	email: Type.Union([Type.String(), Type.Null()]),
	name: Type.Union([Type.String(), Type.Null()]),
	avatar_url: Type.Union([Type.String(), Type.Null()]),
	created_at: Type.String(),
});
export type OrgMember = Static<typeof OrgMemberSchema>;

/**
 * Update member role request schema
 */
export const UpdateOrgMemberRoleSchema = Type.Object({
	role: Type.Enum(OrgRoleTypeEnum),
});
export type UpdateOrgMemberRole = Static<typeof UpdateOrgMemberRoleSchema>;

/**
 * Transfer ownership request schema
 */
export const TransferOwnershipSchema = Type.Object({
	new_owner_user_id: Type.String({ format: "uuid" }),
});
export type TransferOwnership = Static<typeof TransferOwnershipSchema>;

/**
 * Single org response schema
 */
export const OrgResponseSchema = Type.Object({
	success: Type.Literal(true),
	data: Type.Object({
		org: OrgRoleWithOrgSchema,
	}),
});
export type OrgResponse = Static<typeof OrgResponseSchema>;

/**
 * Org error response schema
 * Discriminated union by error code
 */
export const OrgErrorSchema = Type.Union([
	Type.Object({
		code: Type.Literal("UNKNOWN_ERROR"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("VALIDATION_ERROR"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("ORG_ID_MISMATCH"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("ORG_NOT_FOUND"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("ORG_ROLE_NOT_FOUND"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("USER_NOT_IN_ORG"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("FORBIDDEN"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("UNAUTHORIZED"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("INVALID_ROLE"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("ORG_ID_REQUIRED"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("SLUG_ALREADY_EXISTS"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("FETCH_FAILED"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("CREATE_FAILED"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("UPDATE_FAILED"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("DELETE_FAILED"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("ROLE_CREATION_FAILED"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("INVITATION_NOT_FOUND"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("INVITATION_ALREADY_EXISTS"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("ALREADY_MEMBER"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("CANNOT_REMOVE_OWNER"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("CANNOT_INVITE_AS_OWNER"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("MEMBER_NOT_FOUND"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("NOT_OWNER"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("CANNOT_LEAVE_AS_OWNER"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("CANNOT_CHANGE_OWNER_ROLE"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("INVITATION_EXPIRED"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("EMAIL_MISMATCH"),
		message: Type.String(),
	}),
]);
export type OrgError = Static<typeof OrgErrorSchema>;

/**
 * Org error response wrapper
 */
export const OrgErrorResponseSchema = Type.Object({
	success: Type.Literal(false),
	error: OrgErrorSchema,
});
export type OrgErrorResponse = Static<typeof OrgErrorResponseSchema>;

export const OrgRequestResponseSchema = Type.Union([OrgResponseSchema, OrgErrorResponseSchema]);
export type OrgRequestResponse = Static<typeof OrgRequestResponseSchema>;

export type _CheckOrgRow = AssertTrue<AssertSchemaCompatibleWithRow<Org, "orgs">>;
export type _CheckCreateOrg = AssertTrue<AssertSchemaCompatibleWithInsert<CreateOrg, "orgs">>;
export type _CheckUpdateOrg = AssertTrue<AssertSchemaCompatibleWithUpdate<UpdateOrg, "orgs">>;
export type _CheckOrgRoleRow = AssertTrue<AssertSchemaCompatibleWithRow<OrgRole, "org_roles">>;
export type _CheckAddOrgRole = AssertTrue<AssertSchemaCompatibleWithInsert<AddOrgRole, "org_roles">>;
