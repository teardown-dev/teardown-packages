import type { AsyncResult } from "@teardown/types";
import { EventEmitter } from "eventemitter3";
import { z } from "zod";
import type { ApiClient } from "../api";
import type { DeviceClient, NotificationPlatformEnum } from "../device/device.client";
import type { EventsClient } from "../events";
import { IdentifyVersionStatusEnum } from "../force-update";
import type { Logger, LoggingClient } from "../logging";
import type { NotificationsClient } from "../notifications/notifications.client";
import type { StorageClient, SupportedStorage } from "../storage";
import type { UtilsClient } from "../utils";

export interface Persona {
	name?: string | undefined;
	user_id?: string | undefined;
	email?: string | undefined;
}

export interface SignOutOptions {
	/**
	 * Additional properties to include in the sign out event
	 */
	properties?: Record<string, unknown>;
	/**
	 * Whether to wait for the event to be sent before clearing state.
	 * Default: true (fire-and-forget if false)
	 */
	waitForEvent?: boolean;
}

export interface UpdateInfo {
	version: string;
	build: string;
	update_id: string;
	effective_date: Date;
	release_notes: string | null;
}

export interface IdentityUser {
	session_id: string;
	device_id: string;
	user_id: string;
	token: string;
	version_info: {
		status: IdentifyVersionStatusEnum;
		update: UpdateInfo | null;
	};
}

export const UnidentifiedSessionStateSchema = z.object({
	type: z.literal("unidentified"),
});
export const IdentifyingSessionStateSchema = z.object({
	type: z.literal("identifying"),
});

export const UpdateVersionStatusBodySchema = z.object({
	version: z.string(),
});

export const SessionSchema = z.object({
	session_id: z.string(),
	device_id: z.string(),
	user_id: z.string().or(z.object({ persona_id: z.string() }).transform((val) => val.persona_id)),
	token: z.string(),
});
export type Session = z.infer<typeof SessionSchema>;

export const VersionStatusResponseSchema = z.object({
	status: z.enum(["UPDATE_AVAILABLE", "UPDATE_REQUIRED", "UP_TO_DATE"]),
	latest_version: z.string().optional(),
});

export const UpdateInfoSchema = z.object({
	version: z.string(),
	build: z.string(),
	update_id: z.string(),
	effective_date: z.coerce.date(),
	release_notes: z.string().nullable(),
});

/** Type guard to check if update has nested structure */
function isNestedUpdate(update: unknown): update is { status: string; update: UpdateInfo } {
	return typeof update === "object" && update !== null && "status" in update && "update" in update;
}

// Accept either the nested schema from API or the flat UpdateInfo schema
export const VersionInfoResponseSchema = z.object({
	status: z.enum(IdentifyVersionStatusEnum),
	update: z.union([
		z.object({
			status: z.enum(IdentifyVersionStatusEnum),
			update: UpdateInfoSchema,
		}),
		UpdateInfoSchema,
		z.null(),
	]),
});

export const IdentifiedSessionStateSchema = z.object({
	type: z.literal("identified"),
	session: SessionSchema,
	version_info: z
		.object({
			status: z.enum(IdentifyVersionStatusEnum),
			update: UpdateInfoSchema.nullable(),
		})
		.transform((data) => {
			// Flatten nested structure if present
			if (isNestedUpdate(data.update)) {
				return {
					status: data.status,
					update: data.update.update,
				};
			}
			return data;
		}),
});

export const IdentifyStateSchema = z.discriminatedUnion("type", [
	UnidentifiedSessionStateSchema,
	IdentifyingSessionStateSchema,
	IdentifiedSessionStateSchema,
]);
export type IdentifyState = z.infer<typeof IdentifyStateSchema>;

export type UnidentifiedSessionState = z.infer<typeof UnidentifiedSessionStateSchema>;
export type IdentifyingSessionState = z.infer<typeof IdentifyingSessionStateSchema>;
export type IdentifiedSessionState = z.infer<typeof IdentifiedSessionStateSchema>;

export interface IdentifyStateChangeEvents {
	IDENTIFY_STATE_CHANGED: (state: IdentifyState) => void;
}

export const IDENTIFY_STORAGE_KEY = "IDENTIFY_STATE";

export class IdentityClient {
	private emitter = new EventEmitter<IdentifyStateChangeEvents>();
	private identifyState: IdentifyState = { type: "unidentified" };
	private initialized = false;

	public readonly logger: Logger;
	public readonly utils: UtilsClient;
	public readonly storage: SupportedStorage;

	constructor(
		logging: LoggingClient,
		utils: UtilsClient,
		storage: StorageClient,
		private readonly api: ApiClient,
		private readonly device: DeviceClient,
		private readonly events: EventsClient,
		private readonly notificationsClient?: NotificationsClient
	) {
		this.logger = logging.createLogger({
			name: "IdentityClient",
		});
		this.storage = storage.createStorage("identity");
		this.utils = utils;
		// Don't load from storage here - defer to initialize()
	}

	async initialize(): Promise<void> {
		this.logger.debug("Initializing IdentityClient");
		if (this.initialized) {
			this.logger.debug("IdentityClient already initialized");
			return;
		}
		this.initialized = true;

		try {
			// Load state from storage first (for fallback if identify fails)
			this.identifyState = this.getIdentifyStateFromStorage();
			this.logger.debug(`Initialized with state: ${this.identifyState.type}`);
		} catch (error) {
			// Silently fail on errors - we'll re-identify on app boot if needed
			this.logger.error("Error initializing IdentityClient", { error });
			this.identifyState = { type: "unidentified" };
		}

		// Always identify on app boot to refresh version status
		await this.identify();
	}

	private getIdentifyStateFromStorage(): IdentifyState {
		try {
			const stored = this.storage.getItem(IDENTIFY_STORAGE_KEY);

			if (stored == null) {
				this.logger.info("No stored identity state, returning unidentified");
				return UnidentifiedSessionStateSchema.parse({ type: "unidentified" });
			}

			const parsed = IdentifyStateSchema.parse(JSON.parse(stored));
			this.logger.info(`Parsed identity state from storage: ${parsed.type}`);

			// "identifying" is a transient state - if we restore it, treat as unidentified
			// This can happen if the app was killed during an identify call
			if (parsed.type === "identifying") {
				this.logger.info("Found stale 'identifying' state in storage, resetting to unidentified");
				// Clear the stale state from storage immediately
				this.storage.removeItem(IDENTIFY_STORAGE_KEY);
				return UnidentifiedSessionStateSchema.parse({ type: "unidentified" });
			}

			return parsed;
		} catch (error) {
			this.logger.error("Error getting identify state from storage", { error });
			return { type: "unidentified" };
		}
	}

	private saveIdentifyStateToStorage(identifyState: IdentifyState): void {
		this.storage.setItem(IDENTIFY_STORAGE_KEY, JSON.stringify(identifyState));
	}

	private setIdentifyState(newState: IdentifyState): void {
		if (this.identifyState.type === newState.type) {
			this.logger.info(`Identify state already set: ${this.identifyState.type}`);
			return;
		}

		this.logger.info(`Identify state: ${this.identifyState.type} -> ${newState.type}`);
		this.identifyState = newState;
		this.saveIdentifyStateToStorage(newState);
		this.emitter.emit("IDENTIFY_STATE_CHANGED", newState);
	}

	public onIdentifyStateChange(listener: (state: IdentifyState) => void) {
		this.emitter.addListener("IDENTIFY_STATE_CHANGED", listener);
		return () => {
			this.emitter.removeListener("IDENTIFY_STATE_CHANGED", listener);
		};
	}

	public getIdentifyState(): IdentifyState {
		return this.identifyState;
	}

	public getSessionState(): Session | null {
		if (this.identifyState.type !== "identified") {
			return null;
		}
		return this.identifyState.session;
	}

	public shutdown() {
		this.emitter.removeAllListeners("IDENTIFY_STATE_CHANGED");
	}

	/**
	 * Reset identity state to unidentified.
	 * Clears stored state and emits state change.
	 */
	public reset(): void {
		this.setIdentifyState({ type: "unidentified" });
	}

	/**
	 * Internal method to clear identity state.
	 * Used by signOut() and signOutAll().
	 */
	private clearIdentityState(): void {
		this.storage.removeItem(IDENTIFY_STORAGE_KEY);
		this.setIdentifyState({ type: "unidentified" });
	}

	/**
	 * Sign out the current user.
	 * Sends a sign_out event to the backend and clears session/user identity.
	 * The deviceId is preserved - the same device will be recognized on next identify.
	 *
	 * @param options - Optional configuration for the sign out
	 * @returns AsyncResult indicating success/failure of the event send
	 */
	async signOut(options?: SignOutOptions): AsyncResult<void> {
		this.logger.info("Signing out user");

		const session = this.getSessionState();
		const waitForEvent = options?.waitForEvent ?? true;

		// Send event FIRST while session/device data still exists
		const eventPromise = this.events.track(
			{
				event_name: "user_signed_out",
				event_type: "action",
				properties: {
					sign_out_type: "sign_out",
					session_id: session?.session_id,
					user_id: session?.user_id,
					...options?.properties,
				},
			},
			session?.session_id
		);

		if (waitForEvent) {
			const result = await eventPromise;
			// Clear state regardless of event send result
			this.clearIdentityState();
			return result;
		}

		// Fire-and-forget mode - don't await but still clear state
		void eventPromise;
		this.clearIdentityState();
		return { success: true, data: undefined };
	}

	/**
	 * Sign out and reset all state including deviceId.
	 * Sends a sign_out_all event to the backend and clears all SDK state.
	 * The device will appear as a fresh install on next identify.
	 *
	 * @param options - Optional configuration for the sign out
	 * @returns AsyncResult indicating success/failure of the event send
	 */
	async signOutAll(options?: SignOutOptions): AsyncResult<void> {
		this.logger.info("Signing out all - full reset");

		const session = this.getSessionState();
		const waitForEvent = options?.waitForEvent ?? true;

		// Send event FIRST while session/device data still exists
		const eventPromise = this.events.track(
			{
				event_name: "user_signed_out",
				event_type: "action",
				properties: {
					sign_out_type: "sign_out_all",
					session_id: session?.session_id,
					user_id: session?.user_id,
					...options?.properties,
				},
			},
			session?.session_id
		);

		if (waitForEvent) {
			const result = await eventPromise;
			// Clear all state regardless of event send result
			this.clearIdentityState();
			this.device.reset();
			return result;
		}

		// Fire-and-forget mode - don't await but still clear state
		void eventPromise;
		this.clearIdentityState();
		this.device.reset();
		return { success: true, data: undefined };
	}

	/**
	 * Re-identify the current persona to refresh session data.
	 * Only works if already identified.
	 */
	async refresh(): AsyncResult<IdentityUser> {
		if (this.identifyState.type !== "identified") {
			return { success: false, error: "Not identified" };
		}
		return this.identify();
	}

	/**
	 * Catches all errors and returns an AsyncResult
	 * @param fn - The function to try
	 * @returns An {@link AsyncResult}
	 */
	private async tryCatch<T>(fn: () => AsyncResult<T>, onError?: (error: Error) => void): AsyncResult<T> {
		try {
			const result = await fn();
			return result;
		} catch (error) {
			if (onError) {
				onError(error instanceof Error ? error : new Error(String(error)));
			}
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	/**
	 * Extract error message from API validation error response (422)
	 */
	private extractValidationErrorMessage(errorValue: unknown): string {
		if (typeof errorValue === "string") return errorValue;
		if (typeof errorValue === "object" && errorValue !== null) {
			const obj = errorValue as { summary?: string; message?: string };
			if (obj.summary) return obj.summary;
			if (obj.message) return obj.message;
		}
		return "Unknown error";
	}

	/**
	 * Extract error message from API error response (non-422)
	 */
	private extractErrorMessage(errorValue: unknown): string {
		if (typeof errorValue === "string") return errorValue;
		if (typeof errorValue === "object" && errorValue !== null) {
			const obj = errorValue as { code?: string; message?: string };
			if (obj.message) return obj.message;
		}
		return "Unknown error";
	}

	/**
	 * Get push notification info if notifications client is configured
	 */
	private async getNotificationsInfo(): Promise<
		| {
				push: {
					enabled: boolean;
					granted: boolean;
					token: string | null;
					platform: NotificationPlatformEnum;
				};
		  }
		| undefined
	> {
		if (!this.notificationsClient) return undefined;

		this.logger.debug("Getting push notification token...");
		const token = await this.notificationsClient.getToken();
		this.logger.debug(`Push token retrieved: ${token ? "yes" : "no"}, platform: ${this.notificationsClient.platform}`);

		return {
			push: {
				enabled: true,
				granted: token !== null,
				token,
				platform: this.notificationsClient.platform,
			},
		};
	}

	/**
	 * Flatten nested version_info structure from API response
	 */
	private flattenVersionInfo(rawVersionInfo: { status: string; update: unknown }): {
		status: IdentifyVersionStatusEnum;
		update: UpdateInfo | null;
	} {
		let flattenedUpdate: UpdateInfo | null = null;

		if (rawVersionInfo.update) {
			flattenedUpdate = isNestedUpdate(rawVersionInfo.update)
				? rawVersionInfo.update.update
				: (rawVersionInfo.update as UpdateInfo);
		}

		return {
			status: rawVersionInfo.status as IdentifyVersionStatusEnum,
			update: flattenedUpdate,
		};
	}

	async identify(user?: Persona): AsyncResult<IdentityUser> {
		this.logger.info(`Identifying user with persona: ${user?.name ?? "none"}`);
		const previousState = this.identifyState;
		this.setIdentifyState({ type: "identifying" });

		return this.tryCatch(
			async () => {
				this.logger.debug("Getting device ID...");
				const deviceId = await this.device.getDeviceId();
				const deviceInfo = await this.device.getDeviceInfo();
				const notificationsInfo = await this.getNotificationsInfo();

				this.logger.debug("Calling identify API...");
				const response = await this.api.client("/v1/identify", {
					method: "POST",
					headers: {
						"td-api-key": this.api.apiKey,
						"td-org-id": this.api.orgId,
						"td-project-id": this.api.projectId,
						"td-environment-slug": this.api.environmentSlug,
						"td-device-id": deviceId,
					},
					body: {
						user,
						device: {
							timestamp: deviceInfo.timestamp,
							os: deviceInfo.os,
							application: deviceInfo.application,
							hardware: deviceInfo.hardware,
							update: null,
							notifications: notificationsInfo,
						},
					},
				});

				this.logger.info(`Identify API response received`);
				if (response.error != null) {
					this.logger.warn("Identify API error", response.error.status, response.error.value);
					this.setIdentifyState(previousState);

					const errorMessage =
						response.error.status === 422
							? this.extractValidationErrorMessage(response.error.value)
							: this.extractErrorMessage(response.error.value);

					return { success: false, error: errorMessage };
				}

				const parsedSession = SessionSchema.parse(response.data.data);
				const flattenedVersionInfo = this.flattenVersionInfo(response.data.data.version_info);

				const identityUser: IdentityUser = {
					...parsedSession,
					version_info: flattenedVersionInfo,
				};

				this.setIdentifyState({
					type: "identified",
					session: parsedSession,
					version_info: flattenedVersionInfo,
				});

				return { success: true, data: identityUser };
			},
			(error) => {
				this.logger.error("Error identifying user", error);
				this.setIdentifyState(previousState);
				return { success: false, error: error.message };
			}
		);
	}
}
