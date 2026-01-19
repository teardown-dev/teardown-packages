import { Elysia } from "elysia";
import z from "zod";
export declare const baseApp: Elysia<"", {
    decorator: {};
    store: {};
    derive: {};
    resolve: {};
}, {
    typebox: {};
    error: {};
} & {
    typebox: {};
    error: {
        readonly FORBIDDEN: import("@teardown/errors").ForbiddenError;
        readonly NOT_FOUND: import("@teardown/errors").NotFoundError;
        readonly INTERNAL_SERVER_ERROR: import("@teardown/errors").InternalServerError;
        readonly BAD_REQUEST: import("@teardown/errors").BadRequestError;
        readonly UNAUTHORIZED: import("@teardown/errors").UnauthorizedError;
        readonly UNPROCESSABLE_ENTITY: import("@teardown/errors").UnprocessableContentError;
        readonly TOO_MANY_REQUESTS: import("@teardown/errors").RateLimitError;
        readonly SERVICE_UNAVAILABLE: import("@teardown/errors").InternalServerError;
    };
} & {
    typebox: {};
    error: {};
}, {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {};
} & {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {
        200: import("@teardown/errors").ErrorResponse;
    };
} & {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {};
}, {
    get: {
        body: unknown;
        params: {};
        query: unknown;
        headers: unknown;
        response: {
            200: import("@teardown/errors").ErrorResponse | {
                message: string;
                version: string;
            };
        };
    };
} & {
    health: {
        get: {
            body: unknown;
            params: {};
            query: unknown;
            headers: unknown;
            response: {
                200: import("@teardown/errors").ErrorResponse | {
                    status: string;
                    timestamp: string;
                    build_id: string;
                    service_id: string | undefined;
                };
            };
        };
    };
} & {
    v1: {
        identify: {};
    } & {
        identify: {
            post: {
                body: {
                    device: {
                        timestamp?: Date | undefined;
                        os: {
                            platform: import("@teardown/types").DevicePlatformEnum;
                            name: string;
                            version: string;
                        };
                        application: {
                            version: string;
                            build_number: number;
                        };
                        hardware: {
                            device_name: string;
                            device_type: string;
                            device_brand: string;
                        };
                        update: {
                            is_enabled: boolean;
                            update_id: string;
                            update_channel: string;
                            runtime_version: string;
                            emergency_launch: {
                                is_emergency_launch: true;
                                reason: string;
                            } | {
                                is_emergency_launch: false;
                                reason?: undefined;
                            };
                            is_embedded_launch: boolean;
                            created_at: string;
                        } | null;
                        notifications?: {
                            push: {
                                enabled: boolean;
                                granted: boolean;
                                token: string | null;
                                platform: import("@teardown/schemas").NotificationPlatformEnum;
                            };
                        } | undefined;
                    };
                    user?: {
                        persona_id?: string | undefined;
                        user_id?: string | undefined;
                        email?: string | undefined;
                        name?: string | undefined;
                    } | undefined;
                };
                params: {};
                query: unknown;
                headers: {
                    "td-org-id": string;
                    "td-project-id": string;
                    "td-environment-slug": string;
                    "td-api-key": string;
                    "td-device-id": string;
                    "td-session-id"?: string | undefined;
                };
                response: {
                    200: {
                        success: true;
                        data: {
                            session_id: string;
                            device_id: string;
                            user_id: string;
                            token: string;
                            version_info: {
                                status: import("@teardown/schemas").IdentifyVersionStatusEnum;
                                update: {
                                    version: string;
                                    build: string;
                                    update_id: string;
                                    effective_date: Date;
                                    release_notes: string | null;
                                } | null;
                            };
                        };
                    };
                    400: {
                        success: false;
                        error: {
                            code: "MISSING_ORG_ID";
                            message: string;
                        } | {
                            code: "MISSING_PROJECT_ID";
                            message: string;
                        } | {
                            code: "MISSING_ENVIRONMENT_SLUG";
                            message: string;
                        } | {
                            code: "MISSING_DEVICE_ID";
                            message: string;
                        } | {
                            code: "IDENTIFY_FAILED";
                            message: string;
                        } | {
                            code: "NO_SESSION_ID_GENERATED";
                            message: string;
                        } | {
                            code: "NO_DEVICE_ID_GENERATED";
                            message: string;
                        } | {
                            code: "NO_USER_ID_GENERATED";
                            message: string;
                        };
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string | undefined;
                        message?: string | undefined;
                        found?: unknown;
                        property?: string | undefined;
                        expected?: string | undefined;
                    };
                };
            };
        };
    };
} & {
    v1: {
        events: {};
    } & {
        events: {
            post: {
                body: {
                    events: {
                        event_name: string;
                        event_type: "action" | "custom" | "screen_view";
                        properties?: {} | undefined;
                        timestamp?: string | undefined;
                        session_id?: string | undefined;
                        device_id?: string | undefined;
                    }[];
                    session_id?: string | undefined;
                    device_id?: string | undefined;
                };
                params: {};
                query: unknown;
                headers: {
                    "td-org-id": string;
                    "td-project-id": string;
                    "td-environment-slug": string;
                    "td-api-key": string;
                    "td-device-id"?: string | undefined;
                    "td-session-id"?: string | undefined;
                };
                response: {
                    200: {
                        success: true;
                        data: {
                            event_ids: string[];
                            processed_count: number;
                            failed_count: number;
                        };
                    };
                    400: {
                        success: false;
                        error: {
                            code: "MISSING_ORG_ID";
                            message: string;
                        } | {
                            code: "MISSING_PROJECT_ID";
                            message: string;
                        } | {
                            code: "MISSING_ENVIRONMENT_SLUG";
                            message: string;
                        } | {
                            code: "MISSING_DEVICE_ID";
                            message: string;
                        } | {
                            code: "EVENTS_PROCESSING_FAILED";
                            message: string;
                        } | {
                            code: "INVALID_SESSION";
                            message: string;
                        } | {
                            code: "INVALID_DEVICE";
                            message: string;
                        } | {
                            code: "BATCH_SIZE_EXCEEDED";
                            message: string;
                        } | {
                            code: "VALIDATION_ERROR";
                            message: string;
                        };
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string | undefined;
                        message?: string | undefined;
                        found?: unknown;
                        property?: string | undefined;
                        expected?: string | undefined;
                    };
                };
            };
        };
    };
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
}, {
    derive: {};
    resolve: {};
    schema: import("elysia").UnwrapRoute<{
        headers: z.ZodObject<{
            authorization: z.ZodOptional<z.ZodString>;
            "td-api-key": z.ZodString;
            "td-org-id": z.ZodString;
            "td-project-id": z.ZodString;
            "td-environment-slug": z.ZodOptional<z.ZodString>;
            "td-device-id": z.ZodOptional<z.ZodString>;
            "td-session-id": z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
    }, {}, "">;
    standaloneSchema: {};
    response: {};
} & {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
}>;
export declare const IngestApp: typeof baseApp;
export type IngestApp = typeof baseApp;
//# sourceMappingURL=app.d.ts.map