import { type Static, Type } from "@sinclair/typebox";
import { SubscriptionStatusEnum, SubscriptionTierEnum } from "@teardown/types";

/**
 * Subscription tier schema
 */
export const SubscriptionTierSchema = Type.Enum(SubscriptionTierEnum);
export type SubscriptionTier = Static<typeof SubscriptionTierSchema>;

/**
 * Subscription status schema
 */
export const SubscriptionStatusSchema = Type.Enum(SubscriptionStatusEnum);
export type SubscriptionStatus = Static<typeof SubscriptionStatusSchema>;

/**
 * Subscription details schema
 */
export const SubscriptionSchema = Type.Object({
	tier: SubscriptionTierSchema,
	status: Type.Union([SubscriptionStatusSchema, Type.Null()]),
	period_start: Type.Union([Type.String(), Type.Null()]),
	period_end: Type.Union([Type.String(), Type.Null()]),
	mau_limit: Type.Number({ minimum: 0 }),
	project_limit: Type.Number({ minimum: 0 }),
	seat_limit: Type.Number({ minimum: 0 }),
	stripe_customer_id: Type.Union([Type.String(), Type.Null()]),
	stripe_subscription_id: Type.Union([Type.String(), Type.Null()]),
	billing_email: Type.Union([Type.String({ format: "email" }), Type.Null()]),
});
export type Subscription = Static<typeof SubscriptionSchema>;

/**
 * Current usage schema
 */
export const UsageSchema = Type.Object({
	mau_count: Type.Number({ minimum: 0 }),
	project_count: Type.Number({ minimum: 0 }),
	seat_count: Type.Number({ minimum: 0 }),
	period_start: Type.String(),
	period_end: Type.String(),
});
export type Usage = Static<typeof UsageSchema>;

/**
 * Subscription with usage schema
 */
export const SubscriptionWithUsageSchema = Type.Object({
	subscription: SubscriptionSchema,
	usage: UsageSchema,
	is_over_limit: Type.Object({
		mau: Type.Boolean(),
		projects: Type.Boolean(),
		seats: Type.Boolean(),
	}),
});
export type SubscriptionWithUsage = Static<typeof SubscriptionWithUsageSchema>;

/**
 * Create checkout session request
 */
export const CreateCheckoutSessionSchema = Type.Object({
	tier: Type.Union([
		Type.Literal(SubscriptionTierEnum.STARTER),
		Type.Literal(SubscriptionTierEnum.GROWTH),
		Type.Literal(SubscriptionTierEnum.SCALE),
	]),
	success_url: Type.String({ format: "uri" }),
	cancel_url: Type.String({ format: "uri" }),
});
export type CreateCheckoutSession = Static<typeof CreateCheckoutSessionSchema>;

/**
 * Checkout session response
 */
export const CheckoutSessionResponseSchema = Type.Object({
	success: Type.Literal(true),
	data: Type.Object({
		session_url: Type.String({ format: "uri" }),
		session_id: Type.String(),
	}),
});
export type CheckoutSessionResponse = Static<typeof CheckoutSessionResponseSchema>;

/**
 * Create portal session request
 */
export const CreatePortalSessionSchema = Type.Object({
	return_url: Type.String({ format: "uri" }),
});
export type CreatePortalSession = Static<typeof CreatePortalSessionSchema>;

/**
 * Portal session response
 */
export const PortalSessionResponseSchema = Type.Object({
	success: Type.Literal(true),
	data: Type.Object({
		portal_url: Type.String({ format: "uri" }),
	}),
});
export type PortalSessionResponse = Static<typeof PortalSessionResponseSchema>;

/**
 * Get subscription response
 */
export const GetSubscriptionResponseSchema = Type.Object({
	success: Type.Literal(true),
	data: SubscriptionWithUsageSchema,
});
export type GetSubscriptionResponse = Static<typeof GetSubscriptionResponseSchema>;

/**
 * Billing error codes
 */
export const BillingErrorSchema = Type.Union([
	Type.Object({
		code: Type.Literal("NOT_FOUND"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("FORBIDDEN"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("ALREADY_SUBSCRIBED"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("STRIPE_ERROR"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("INVALID_TIER"),
		message: Type.String(),
	}),
	Type.Object({
		code: Type.Literal("LIMIT_EXCEEDED"),
		message: Type.String(),
		details: Type.Object({
			limit_type: Type.Union([Type.Literal("mau"), Type.Literal("projects"), Type.Literal("seats")]),
			current: Type.Number(),
			limit: Type.Number(),
		}),
	}),
	Type.Object({
		code: Type.Literal("NO_STRIPE_CUSTOMER"),
		message: Type.String(),
	}),
]);
export type BillingError = Static<typeof BillingErrorSchema>;

/**
 * Billing error response
 */
export const BillingErrorResponseSchema = Type.Object({
	success: Type.Literal(false),
	error: BillingErrorSchema,
});
export type BillingErrorResponse = Static<typeof BillingErrorResponseSchema>;
