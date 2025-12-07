import { describe, expect, mock, test } from "bun:test";

// Mock react-native before any imports that use it
mock.module("react-native", () => ({
	AppState: {
		addEventListener: () => ({ remove: () => {} }),
	},
}));

// Import after mock
const { IdentityClient } = await import("./identity.client");
const { IdentifyVersionStatusEnum } = await import("../force-update");
type IdentifyState = import("./identity.client").IdentifyState;

function createMockLoggingClient() {
	return {
		createLogger: () => ({
			info: () => {},
			warn: () => {},
			error: () => {},
			debug: () => {},
		}),
	};
}

function createMockStorageClient() {
	const storage = new Map<string, string>();
	return {
		createStorage: () => ({
			getItem: (key: string) => storage.get(key) ?? null,
			setItem: (key: string, value: string) => storage.set(key, value),
			removeItem: (key: string) => storage.delete(key),
		}),
		getStorage: () => storage,
	};
}

function createMockUtilsClient() {
	return {
		generateRandomUUID: async () => "mock-uuid",
	};
}

function createMockDeviceClient() {
	return {
		getDeviceId: async () => "mock-device-id",
		getDeviceInfo: async () => ({
			application: { name: "TestApp", version: "1.0.0", build: "100", bundle_id: "com.test" },
			hardware: { brand: "Apple", model: "iPhone", device_type: "PHONE" },
			os: { name: "iOS", version: "17.0" },
			notifications: { push_token: null, platform: null },
			update: null,
		}),
	};
}

function createMockApiClient(options: {
	success?: boolean;
	versionStatus?: IdentifyVersionStatusEnum;
	errorStatus?: number;
	errorMessage?: string;
} = {}) {
	const { success = true, versionStatus = IdentifyVersionStatusEnum.UP_TO_DATE, errorStatus, errorMessage } = options;

	return {
		apiKey: "test-api-key",
		orgId: "test-org-id",
		projectId: "test-project-id",
		client: async () => {
			if (!success) {
				return {
					error: {
						status: errorStatus ?? 500,
						value: { message: errorMessage ?? "API Error", error: { message: errorMessage ?? "API Error" } },
					},
					data: null,
				};
			}
			return {
				error: null,
				data: {
					data: {
						session_id: "session-123",
						device_id: "device-123",
						persona_id: "persona-123",
						token: "token-123",
						version_info: { status: versionStatus },
					},
				},
			};
		},
	};
}

describe("IdentityClient", () => {
	describe("initial state", () => {
		test("starts with unidentified state when no stored state", () => {
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();
			const mockUtils = createMockUtilsClient();
			const mockApi = createMockApiClient();
			const mockDevice = createMockDeviceClient();

			const client = new IdentityClient(
				mockLogging as never,
				mockUtils as never,
				mockStorage as never,
				mockApi as never,
				mockDevice as never
			);

			expect(client.getIdentifyState().type).toBe("unidentified");
		});

		test("restores state from storage", () => {
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();
			const mockUtils = createMockUtilsClient();
			const mockApi = createMockApiClient();
			const mockDevice = createMockDeviceClient();

			// Pre-populate storage with identified state
			const storedState = {
				type: "identified",
				session: { session_id: "s1", device_id: "d1", persona_id: "p1", token: "t1" },
				version_info: { status: IdentifyVersionStatusEnum.UP_TO_DATE, update: null },
			};
			mockStorage.getStorage().set("IDENTIFY_STATE", JSON.stringify(storedState));

			const client = new IdentityClient(
				mockLogging as never,
				mockUtils as never,
				mockStorage as never,
				mockApi as never,
				mockDevice as never
			);

			const state = client.getIdentifyState();
			expect(state.type).toBe("identified");
			if (state.type === "identified") {
				expect(state.session.session_id).toBe("s1");
			}
		});
	});

	describe("identify", () => {
		test("transitions to identifying then identified on success", async () => {
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();
			const mockUtils = createMockUtilsClient();
			const mockApi = createMockApiClient({ success: true });
			const mockDevice = createMockDeviceClient();

			const client = new IdentityClient(
				mockLogging as never,
				mockUtils as never,
				mockStorage as never,
				mockApi as never,
				mockDevice as never
			);

			const stateChanges: IdentifyState[] = [];
			client.onIdentifyStateChange((state) => stateChanges.push(state));

			const result = await client.identify();

			expect(result.success).toBe(true);
			expect(stateChanges).toHaveLength(2);
			expect(stateChanges[0].type).toBe("identifying");
			expect(stateChanges[1].type).toBe("identified");
		});

		test("returns user data on successful identify", async () => {
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();
			const mockUtils = createMockUtilsClient();
			const mockApi = createMockApiClient({ versionStatus: IdentifyVersionStatusEnum.UPDATE_AVAILABLE });
			const mockDevice = createMockDeviceClient();

			const client = new IdentityClient(
				mockLogging as never,
				mockUtils as never,
				mockStorage as never,
				mockApi as never,
				mockDevice as never
			);

			const result = await client.identify();

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.session_id).toBe("session-123");
				expect(result.data.device_id).toBe("device-123");
				expect(result.data.version_info.status).toBe(IdentifyVersionStatusEnum.UPDATE_AVAILABLE);
			}
		});

		test("reverts to previous state on API error", async () => {
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();
			const mockUtils = createMockUtilsClient();
			const mockApi = createMockApiClient({ success: false, errorStatus: 500, errorMessage: "Server error" });
			const mockDevice = createMockDeviceClient();

			const client = new IdentityClient(
				mockLogging as never,
				mockUtils as never,
				mockStorage as never,
				mockApi as never,
				mockDevice as never
			);

			const result = await client.identify();

			expect(result.success).toBe(false);
			// Should revert to unidentified (the previous state)
			expect(client.getIdentifyState().type).toBe("unidentified");
		});

		test("handles 422 validation error", async () => {
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();
			const mockUtils = createMockUtilsClient();
			const mockApi = createMockApiClient({ success: false, errorStatus: 422, errorMessage: "Validation failed" });
			const mockDevice = createMockDeviceClient();

			const client = new IdentityClient(
				mockLogging as never,
				mockUtils as never,
				mockStorage as never,
				mockApi as never,
				mockDevice as never
			);

			const result = await client.identify();

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBe("Validation failed");
			}
		});

		test("persists identified state to storage", async () => {
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();
			const mockUtils = createMockUtilsClient();
			const mockApi = createMockApiClient({ success: true });
			const mockDevice = createMockDeviceClient();

			const client = new IdentityClient(
				mockLogging as never,
				mockUtils as never,
				mockStorage as never,
				mockApi as never,
				mockDevice as never
			);

			await client.identify();

			const stored = mockStorage.getStorage().get("IDENTIFY_STATE");
			expect(stored).toBeDefined();
			const parsed = JSON.parse(stored!);
			expect(parsed.type).toBe("identified");
			expect(parsed.session.session_id).toBe("session-123");
		});
	});

	describe("onIdentifyStateChange", () => {
		test("emits state changes to listeners", async () => {
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();
			const mockUtils = createMockUtilsClient();
			const mockApi = createMockApiClient();
			const mockDevice = createMockDeviceClient();

			const client = new IdentityClient(
				mockLogging as never,
				mockUtils as never,
				mockStorage as never,
				mockApi as never,
				mockDevice as never
			);

			const states: IdentifyState[] = [];
			client.onIdentifyStateChange((state) => states.push(state));

			await client.identify();

			expect(states.length).toBeGreaterThan(0);
		});

		test("returns unsubscribe function", async () => {
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();
			const mockUtils = createMockUtilsClient();
			const mockApi = createMockApiClient();
			const mockDevice = createMockDeviceClient();

			const client = new IdentityClient(
				mockLogging as never,
				mockUtils as never,
				mockStorage as never,
				mockApi as never,
				mockDevice as never
			);

			const states: IdentifyState[] = [];
			const unsubscribe = client.onIdentifyStateChange((state) => states.push(state));

			unsubscribe();

			await client.identify();

			// Should not receive any state changes after unsubscribing
			expect(states).toHaveLength(0);
		});
	});

	describe("refresh", () => {
		test("returns error when not identified", async () => {
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();
			const mockUtils = createMockUtilsClient();
			const mockApi = createMockApiClient();
			const mockDevice = createMockDeviceClient();

			const client = new IdentityClient(
				mockLogging as never,
				mockUtils as never,
				mockStorage as never,
				mockApi as never,
				mockDevice as never
			);

			const result = await client.refresh();

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBe("Not identified");
			}
		});

		test("re-identifies when already identified", async () => {
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();
			const mockUtils = createMockUtilsClient();
			const mockApi = createMockApiClient();
			const mockDevice = createMockDeviceClient();

			const client = new IdentityClient(
				mockLogging as never,
				mockUtils as never,
				mockStorage as never,
				mockApi as never,
				mockDevice as never
			);

			// First identify
			await client.identify();
			expect(client.getIdentifyState().type).toBe("identified");

			// Then refresh
			const result = await client.refresh();
			expect(result.success).toBe(true);
		});
	});

	describe("reset", () => {
		test("resets state to unidentified", async () => {
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();
			const mockUtils = createMockUtilsClient();
			const mockApi = createMockApiClient();
			const mockDevice = createMockDeviceClient();

			const client = new IdentityClient(
				mockLogging as never,
				mockUtils as never,
				mockStorage as never,
				mockApi as never,
				mockDevice as never
			);

			// First identify
			await client.identify();
			expect(client.getIdentifyState().type).toBe("identified");

			// Then reset
			client.reset();

			expect(client.getIdentifyState().type).toBe("unidentified");
			// Storage contains unidentified state after reset (setIdentifyState saves it)
			const stored = mockStorage.getStorage().get("IDENTIFY_STATE");
			expect(stored).toBeDefined();
			if (stored) {
				expect(JSON.parse(stored).type).toBe("unidentified");
			}
		});

		test("emits unidentified state on reset", async () => {
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();
			const mockUtils = createMockUtilsClient();
			const mockApi = createMockApiClient();
			const mockDevice = createMockDeviceClient();

			const client = new IdentityClient(
				mockLogging as never,
				mockUtils as never,
				mockStorage as never,
				mockApi as never,
				mockDevice as never
			);

			await client.identify();

			const states: IdentifyState[] = [];
			client.onIdentifyStateChange((state) => states.push(state));

			client.reset();

			expect(states).toHaveLength(1);
			expect(states[0].type).toBe("unidentified");
		});
	});

	describe("initialize", () => {
		test("calls identify on initialize", async () => {
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();
			const mockUtils = createMockUtilsClient();
			const mockApi = createMockApiClient();
			const mockDevice = createMockDeviceClient();

			const client = new IdentityClient(
				mockLogging as never,
				mockUtils as never,
				mockStorage as never,
				mockApi as never,
				mockDevice as never
			);

			expect(client.getIdentifyState().type).toBe("unidentified");

			await client.initialize();

			expect(client.getIdentifyState().type).toBe("identified");
		});
	});

	describe("getSessionState", () => {
		test("returns null when not identified", () => {
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();
			const mockUtils = createMockUtilsClient();
			const mockApi = createMockApiClient();
			const mockDevice = createMockDeviceClient();

			const client = new IdentityClient(
				mockLogging as never,
				mockUtils as never,
				mockStorage as never,
				mockApi as never,
				mockDevice as never
			);

			expect(client.getSessionState()).toBeNull();
		});

		test("returns session when identified", async () => {
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();
			const mockUtils = createMockUtilsClient();
			const mockApi = createMockApiClient();
			const mockDevice = createMockDeviceClient();

			const client = new IdentityClient(
				mockLogging as never,
				mockUtils as never,
				mockStorage as never,
				mockApi as never,
				mockDevice as never
			);

			await client.identify();

			const session = client.getSessionState();
			expect(session).not.toBeNull();
			expect(session?.session_id).toBe("session-123");
			expect(session?.device_id).toBe("device-123");
			expect(session?.persona_id).toBe("persona-123");
			expect(session?.token).toBe("token-123");
		});
	});

	describe("shutdown", () => {
		test("removes all listeners", async () => {
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();
			const mockUtils = createMockUtilsClient();
			const mockApi = createMockApiClient();
			const mockDevice = createMockDeviceClient();

			const client = new IdentityClient(
				mockLogging as never,
				mockUtils as never,
				mockStorage as never,
				mockApi as never,
				mockDevice as never
			);

			const states: IdentifyState[] = [];
			client.onIdentifyStateChange((state) => states.push(state));

			client.shutdown();

			await client.identify();

			// Should not receive any state changes after shutdown
			expect(states).toHaveLength(0);
		});
	});
});
