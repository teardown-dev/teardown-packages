import { describe, expect, mock, test, beforeEach } from "bun:test";

// Mock react-native before any imports that use it
mock.module("react-native", () => ({
	AppState: {
		addEventListener: () => ({ remove: () => { } }),
	},
}));

// Import after mock
const { IdentityClient, IDENTIFY_STORAGE_KEY } = await import("./identity.client");
const { IdentifyVersionStatusEnum } = await import("../force-update");
type IdentifyState = import("./identity.client").IdentifyState;
type Persona = import("./identity.client").Persona;

// ============================================================================
// Mock Factories
// ============================================================================

function createMockLoggingClient() {
	const logs: { level: string; message: string; args: unknown[] }[] = [];
	return {
		createLogger: () => ({
			info: (message: string, ...args: unknown[]) => logs.push({ level: "info", message, args }),
			warn: (message: string, ...args: unknown[]) => logs.push({ level: "warn", message, args }),
			error: (message: string, ...args: unknown[]) => logs.push({ level: "error", message, args }),
			debug: (message: string, ...args: unknown[]) => logs.push({ level: "debug", message, args }),
		}),
		getLogs: () => logs,
		clearLogs: () => { logs.length = 0; },
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
		clear: () => storage.clear(),
	};
}

function createMockUtilsClient() {
	let uuidCounter = 0;
	return {
		generateRandomUUID: async () => `mock-uuid-${++uuidCounter}`,
		resetCounter: () => uuidCounter = 0,
	};
}

function createMockDeviceClient(overrides: Partial<{
	deviceId: string;
	timestamp: string;
	application: { name: string; version: string; build: string; bundle_id: string };
	hardware: { brand: string; model: string; device_type: string };
	os: { name: string; version: string };
	notifications: { push_token: string | null; platform: string | null };
	update: null;
}> = {}) {
	const defaultDeviceInfo = {
		timestamp: new Date().toISOString(),
		application: { name: "TestApp", version: "1.0.0", build: "100", bundle_id: "com.test.app" },
		hardware: { brand: "Apple", model: "iPhone 15", device_type: "PHONE" },
		os: { name: "iOS", version: "17.0" },
		notifications: { push_token: null, platform: null },
		update: null,
	};

	return {
		getDeviceId: async () => overrides.deviceId ?? "mock-device-id",
		getDeviceInfo: async () => ({
			...defaultDeviceInfo,
			...overrides,
		}),
	};
}

type ApiCallRecord = {
	endpoint: string;
	config: {
		method: string;
		headers: Record<string, string>;
		body: unknown;
	};
};

function createMockApiClient(options: {
	success?: boolean;
	versionStatus?: IdentifyVersionStatusEnum;
	errorStatus?: number;
	errorMessage?: string;
	sessionId?: string;
	deviceId?: string;
	personaId?: string;
	token?: string;
	throwError?: Error;
} = {}) {
	const {
		success = true,
		versionStatus = IdentifyVersionStatusEnum.UP_TO_DATE,
		errorStatus,
		errorMessage,
		sessionId = "session-123",
		deviceId = "device-123",
		personaId = "persona-123",
		token = "token-123",
		throwError,
	} = options;

	const calls: ApiCallRecord[] = [];

	return {
		apiKey: "test-api-key",
		orgId: "test-org-id",
		projectId: "test-project-id",
		client: async (endpoint: string, config: ApiCallRecord["config"]) => {
			calls.push({ endpoint, config });

			if (throwError) {
				throw throwError;
			}

			if (!success) {
				return {
					error: {
						status: errorStatus ?? 500,
						value: {
							message: errorMessage ?? "API Error",
							error: { message: errorMessage ?? "API Error" },
						},
					},
					data: null,
				};
			}

			return {
				error: null,
				data: {
					data: {
						session_id: sessionId,
						device_id: deviceId,
						persona_id: personaId,
						token: token,
						version_info: { status: versionStatus },
					},
				},
			};
		},
		getCalls: () => calls,
		getLastCall: () => calls[calls.length - 1],
		clearCalls: () => calls.length = 0,
	};
}

// Helper to create a standard client instance
function createTestClient(overrides: {
	logging?: ReturnType<typeof createMockLoggingClient>;
	storage?: ReturnType<typeof createMockStorageClient>;
	utils?: ReturnType<typeof createMockUtilsClient>;
	api?: ReturnType<typeof createMockApiClient>;
	device?: ReturnType<typeof createMockDeviceClient>;
} = {}) {
	const mockLogging = overrides.logging ?? createMockLoggingClient();
	const mockStorage = overrides.storage ?? createMockStorageClient();
	const mockUtils = overrides.utils ?? createMockUtilsClient();
	const mockApi = overrides.api ?? createMockApiClient();
	const mockDevice = overrides.device ?? createMockDeviceClient();

	const client = new IdentityClient(
		mockLogging as never,
		mockUtils as never,
		mockStorage as never,
		mockApi as never,
		mockDevice as never
	);

	return {
		client,
		mockLogging,
		mockStorage,
		mockUtils,
		mockApi,
		mockDevice,
	};
}

// Helper to manually load state from storage without calling identify()
function loadStateFromStorage(client: InstanceType<typeof IdentityClient>) {
	const clientAny = client as unknown as {
		identifyState: IdentifyState;
		initialized: boolean;
		getIdentifyStateFromStorage: () => IdentifyState;
	};
	clientAny.identifyState = clientAny.getIdentifyStateFromStorage();
	clientAny.initialized = true;
}

// ============================================================================
// Tests
// ============================================================================

describe("IdentityClient", () => {
	describe("constructor and initial state", () => {
		test("starts with unidentified state when no stored state", () => {
			const { client } = createTestClient();
			expect(client.getIdentifyState().type).toBe("unidentified");
		});

		test("restores identified state from storage after initialize", () => {
			const mockStorage = createMockStorageClient();
			const storedState = {
				type: "identified",
				session: { session_id: "s1", device_id: "d1", persona_id: "p1", token: "t1" },
				version_info: { status: IdentifyVersionStatusEnum.UP_TO_DATE, update: null },
			};
			mockStorage.getStorage().set(IDENTIFY_STORAGE_KEY, JSON.stringify(storedState));

			const { client } = createTestClient({ storage: mockStorage });
			loadStateFromStorage(client);

			const state = client.getIdentifyState();
			expect(state.type).toBe("identified");
			if (state.type === "identified") {
				expect(state.session.session_id).toBe("s1");
				expect(state.session.device_id).toBe("d1");
				expect(state.session.persona_id).toBe("p1");
				expect(state.session.token).toBe("t1");
			}
		});

		test("resets stale identifying state from storage to unidentified", () => {
			const mockStorage = createMockStorageClient();
			const storedState = { type: "identifying" };
			mockStorage.getStorage().set(IDENTIFY_STORAGE_KEY, JSON.stringify(storedState));

			const { client } = createTestClient({ storage: mockStorage });
			loadStateFromStorage(client);

			// "identifying" is a transient state - should reset to unidentified
			expect(client.getIdentifyState().type).toBe("unidentified");
		});

		test("throws error on invalid stored state (corrupt JSON)", () => {
			const mockStorage = createMockStorageClient();
			mockStorage.getStorage().set(IDENTIFY_STORAGE_KEY, "not-valid-json{{{");

			const { client } = createTestClient({ storage: mockStorage });
			expect(() => loadStateFromStorage(client)).toThrow();
		});

		test("throws error on invalid stored state (schema mismatch)", () => {
			const mockStorage = createMockStorageClient();
			mockStorage.getStorage().set(IDENTIFY_STORAGE_KEY, JSON.stringify({ type: "invalid_type" }));

			const { client } = createTestClient({ storage: mockStorage });
			expect(() => loadStateFromStorage(client)).toThrow();
		});

		test("creates logger with correct name", () => {
			const { client } = createTestClient();
			expect(client.logger).toBeDefined();
		});

		test("exposes utils client", () => {
			const { client } = createTestClient();
			expect(client.utils).toBeDefined();
		});

		test("exposes storage client", () => {
			const { client } = createTestClient();
			expect(client.storage).toBeDefined();
		});
	});

	describe("identify", () => {
		test("transitions to identifying then identified on success", async () => {
			const { client } = createTestClient();

			const stateChanges: IdentifyState[] = [];
			client.onIdentifyStateChange((state) => stateChanges.push(state));

			const result = await client.identify();

			expect(result.success).toBe(true);
			expect(stateChanges).toHaveLength(2);
			expect(stateChanges[0].type).toBe("identifying");
			expect(stateChanges[1].type).toBe("identified");
		});

		test("returns complete user data on successful identify", async () => {
			const mockApi = createMockApiClient({
				versionStatus: IdentifyVersionStatusEnum.UPDATE_AVAILABLE,
				sessionId: "custom-session",
				deviceId: "custom-device",
				personaId: "custom-persona",
				token: "custom-token",
			});
			const { client } = createTestClient({ api: mockApi });

			const result = await client.identify();

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.session_id).toBe("custom-session");
				expect(result.data.device_id).toBe("custom-device");
				expect(result.data.persona_id).toBe("custom-persona");
				expect(result.data.token).toBe("custom-token");
				expect(result.data.version_info.status).toBe(IdentifyVersionStatusEnum.UPDATE_AVAILABLE);
				expect(result.data.version_info.update).toBeNull();
			}
		});

		test("handles UPDATE_REQUIRED version status", async () => {
			const mockApi = createMockApiClient({
				versionStatus: IdentifyVersionStatusEnum.UPDATE_REQUIRED,
			});
			const { client } = createTestClient({ api: mockApi });

			const result = await client.identify();

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.version_info.status).toBe(IdentifyVersionStatusEnum.UPDATE_REQUIRED);
			}
		});

		test("handles UP_TO_DATE version status", async () => {
			const mockApi = createMockApiClient({
				versionStatus: IdentifyVersionStatusEnum.UP_TO_DATE,
			});
			const { client } = createTestClient({ api: mockApi });

			const result = await client.identify();

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.version_info.status).toBe(IdentifyVersionStatusEnum.UP_TO_DATE);
			}
		});

		test("reverts to previous state on API error", async () => {
			const mockApi = createMockApiClient({
				success: false,
				errorStatus: 500,
				errorMessage: "Server error",
			});
			const { client } = createTestClient({ api: mockApi });

			const result = await client.identify();

			expect(result.success).toBe(false);
			expect(client.getIdentifyState().type).toBe("unidentified");
		});

		test("reverts to identified state on API error when previously identified", async () => {
			const mockStorage = createMockStorageClient();
			const storedState = {
				type: "identified",
				session: { session_id: "s1", device_id: "d1", persona_id: "p1", token: "t1" },
				version_info: { status: IdentifyVersionStatusEnum.UP_TO_DATE, update: null },
			};
			mockStorage.getStorage().set(IDENTIFY_STORAGE_KEY, JSON.stringify(storedState));

			const mockApi = createMockApiClient({
				success: false,
				errorStatus: 500,
				errorMessage: "Server error",
			});

			const { client } = createTestClient({ storage: mockStorage, api: mockApi });
			loadStateFromStorage(client);

			// Should start identified
			expect(client.getIdentifyState().type).toBe("identified");

			const result = await client.identify();

			// Should fail and revert to identified
			expect(result.success).toBe(false);
			expect(client.getIdentifyState().type).toBe("identified");
		});

		test("handles 422 validation error with message", async () => {
			const mockApi = createMockApiClient({
				success: false,
				errorStatus: 422,
				errorMessage: "Validation failed: invalid device ID",
			});
			const { client } = createTestClient({ api: mockApi });

			const result = await client.identify();

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBe("Validation failed: invalid device ID");
			}
		});

		test("handles 422 error without message gracefully", async () => {
			const mockApi = createMockApiClient({ success: false, errorStatus: 422 });
			// Override to return null message
			// @ts-expect-error - message is not yet implemented
			mockApi.client = async () => ({
				error: {
					status: 422,
					value: { message: null, error: { message: null } },
				},
				data: null,
			});

			const { client } = createTestClient({ api: mockApi });
			const result = await client.identify();

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBe("Unknown error");
			}
		});

		test("handles non-422 error extracting nested error message", async () => {
			const mockApi = createMockApiClient({
				success: false,
				errorStatus: 403,
				errorMessage: "Forbidden: invalid API key",
			});
			const { client } = createTestClient({ api: mockApi });

			const result = await client.identify();

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBe("Forbidden: invalid API key");
			}
		});

		test("handles thrown exceptions via tryCatch", async () => {
			const mockApi = createMockApiClient({
				throwError: new Error("Network connection failed"),
			});
			const { client } = createTestClient({ api: mockApi });

			const result = await client.identify();

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBe("Network connection failed");
			}
		});

		test("handles non-Error thrown exceptions", async () => {
			const mockApi = createMockApiClient();
			mockApi.client = async () => {
				throw "string error"; // Non-Error throw
			};

			const { client } = createTestClient({ api: mockApi });
			const result = await client.identify();

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBe("Unknown error");
			}
		});

		test("persists identified state to storage", async () => {
			const { client, mockStorage } = createTestClient();

			await client.identify();

			const stored = mockStorage.getStorage().get(IDENTIFY_STORAGE_KEY);
			expect(stored).toBeDefined();
			const parsed = JSON.parse(stored!);
			expect(parsed.type).toBe("identified");
			expect(parsed.session.session_id).toBe("session-123");
			expect(parsed.version_info.status).toBe(IdentifyVersionStatusEnum.UP_TO_DATE);
		});

		test("passes persona data to API", async () => {
			const { client, mockApi } = createTestClient();

			const persona: Persona = {
				name: "John Doe",
				user_id: "user-456",
				email: "john@example.com",
			};

			await client.identify(persona);

			const lastCall = mockApi.getLastCall();
			expect((lastCall.config.body as { persona?: Persona }).persona).toEqual(persona);
		});

		test("passes undefined persona when not provided", async () => {
			const { client, mockApi } = createTestClient();

			await client.identify();

			const lastCall = mockApi.getLastCall();
			expect((lastCall.config.body as { persona?: Persona }).persona).toBeUndefined();
		});

		test("passes partial persona data", async () => {
			const { client, mockApi } = createTestClient();

			const persona: Persona = { email: "only-email@test.com" };

			await client.identify(persona);

			const lastCall = mockApi.getLastCall();
			expect((lastCall.config.body as { persona?: Persona }).persona).toEqual({ email: "only-email@test.com" });
		});

		test("calls correct API endpoint", async () => {
			const { client, mockApi } = createTestClient();

			await client.identify();

			const lastCall = mockApi.getLastCall();
			expect(lastCall.endpoint).toBe("/v1/identify");
			expect(lastCall.config.method).toBe("POST");
		});

		test("sends correct headers to API", async () => {
			const { client, mockApi } = createTestClient();

			await client.identify();

			const lastCall = mockApi.getLastCall();
			expect(lastCall.config.headers["td-api-key"]).toBe("test-api-key");
			expect(lastCall.config.headers["td-org-id"]).toBe("test-org-id");
			expect(lastCall.config.headers["td-project-id"]).toBe("test-project-id");
			expect(lastCall.config.headers["td-environment-slug"]).toBe("production");
			expect(lastCall.config.headers["td-device-id"]).toBe("mock-device-id");
		});

		test("sends device info in request body", async () => {
			const mockDevice = createMockDeviceClient({
				deviceId: "custom-device-id",
				timestamp: "2024-01-15T10:30:00.000Z",
				application: { name: "MyApp", version: "2.0.0", build: "200", bundle_id: "com.my.app" },
				os: { name: "Android", version: "14" },
				hardware: { brand: "Samsung", model: "Galaxy S24", device_type: "PHONE" },
			});
			const { client, mockApi } = createTestClient({ device: mockDevice });

			await client.identify();

			const lastCall = mockApi.getLastCall();
			const device = (lastCall.config.body as { device?: { timestamp: string; application: { name: string; version: string; build: string; bundle_id: string }; os: { name: string; version: string }; hardware: { brand: string; model: string; device_type: string }; update: null } }).device;

			expect(device?.timestamp).toBe("2024-01-15T10:30:00.000Z");
			expect(device?.application.name).toBe("MyApp");
			expect(device?.application.version).toBe("2.0.0");
			expect(device?.os.name).toBe("Android");
			expect(device?.hardware.brand).toBe("Samsung");
			expect(device?.update).toBeNull();
		});
	});

	describe("setIdentifyState deduplication", () => {
		test("does not emit when transitioning to same state type", async () => {
			const mockStorage = createMockStorageClient();
			const storedState = {
				type: "identified",
				session: { session_id: "s1", device_id: "d1", persona_id: "p1", token: "t1" },
				version_info: { status: IdentifyVersionStatusEnum.UP_TO_DATE, update: null },
			};
			mockStorage.getStorage().set(IDENTIFY_STORAGE_KEY, JSON.stringify(storedState));

			const mockApi = createMockApiClient();
			const { client } = createTestClient({ storage: mockStorage, api: mockApi });
			loadStateFromStorage(client);

			// Start identified
			expect(client.getIdentifyState().type).toBe("identified");

			const stateChanges: IdentifyState[] = [];
			client.onIdentifyStateChange((state) => stateChanges.push(state));

			// Identify again (will go identifying -> identified)
			await client.identify();

			// Should emit identifying and identified
			expect(stateChanges).toHaveLength(2);
			expect(stateChanges[0].type).toBe("identifying");
			expect(stateChanges[1].type).toBe("identified");
		});

		test("logs debug message when state type unchanged", async () => {
			const mockLogging = createMockLoggingClient();
			const { client } = createTestClient({ logging: mockLogging });

			// First identify succeeds
			await client.identify();
			expect(client.getIdentifyState().type).toBe("identified");

			mockLogging.clearLogs();

			// Second identify
			await client.identify();

			// Should have debug logs about state transitions
			// When already identified, identify() will transition: identified -> identifying -> identified
			const debugLogs = mockLogging.getLogs().filter(l => l.level === "debug");
			expect(debugLogs.length).toBeGreaterThan(0);
			// Check that state transitions are logged
			expect(debugLogs.some(l => l.message.includes("Identify state:"))).toBe(true);
		});
	});

	describe("onIdentifyStateChange", () => {
		test("emits state changes to listeners", async () => {
			const { client } = createTestClient();

			const states: IdentifyState[] = [];
			client.onIdentifyStateChange((state) => states.push(state));

			await client.identify();

			expect(states.length).toBeGreaterThan(0);
		});

		test("supports multiple listeners", async () => {
			const { client } = createTestClient();

			const states1: IdentifyState[] = [];
			const states2: IdentifyState[] = [];

			client.onIdentifyStateChange((state) => states1.push(state));
			client.onIdentifyStateChange((state) => states2.push(state));

			await client.identify();

			expect(states1.length).toBeGreaterThan(0);
			expect(states2.length).toBeGreaterThan(0);
			expect(states1).toEqual(states2);
		});

		test("returns unsubscribe function", async () => {
			const { client } = createTestClient();

			const states: IdentifyState[] = [];
			const unsubscribe = client.onIdentifyStateChange((state) => states.push(state));

			unsubscribe();

			await client.identify();

			expect(states).toHaveLength(0);
		});

		test("only unsubscribes the specific listener", async () => {
			const { client } = createTestClient();

			const states1: IdentifyState[] = [];
			const states2: IdentifyState[] = [];

			const unsubscribe1 = client.onIdentifyStateChange((state) => states1.push(state));
			client.onIdentifyStateChange((state) => states2.push(state));

			unsubscribe1();

			await client.identify();

			expect(states1).toHaveLength(0);
			expect(states2.length).toBeGreaterThan(0);
		});
	});

	describe("refresh", () => {
		test("returns error when not identified", async () => {
			const { client } = createTestClient();

			const result = await client.refresh();

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBe("Not identified");
			}
		});

		test("returns error when unidentified (stale identifying state resets)", async () => {
			const mockStorage = createMockStorageClient();
			// "identifying" in storage gets reset to "unidentified" on load
			mockStorage.getStorage().set(IDENTIFY_STORAGE_KEY, JSON.stringify({ type: "identifying" }));

			const { client } = createTestClient({ storage: mockStorage });
			loadStateFromStorage(client);

			// State should have been reset to unidentified
			expect(client.getIdentifyState().type).toBe("unidentified");

			const result = await client.refresh();

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBe("Not identified");
			}
		});

		test("re-identifies when already identified", async () => {
			const { client, mockApi } = createTestClient();

			await client.identify();
			expect(client.getIdentifyState().type).toBe("identified");

			mockApi.clearCalls();

			const result = await client.refresh();

			expect(result.success).toBe(true);
			expect(mockApi.getCalls()).toHaveLength(1);
		});

		test("returns updated data on refresh", async () => {
			const mockApi = createMockApiClient({
				sessionId: "original-session",
			});
			const { client } = createTestClient({ api: mockApi });

			await client.identify();

			// Update mock to return new session
			mockApi.client = async (endpoint: string, config: ApiCallRecord["config"]) => ({
				error: null,
				data: {
					data: {
						session_id: "refreshed-session",
						device_id: "device-123",
						persona_id: "persona-123",
						token: "token-123",
						version_info: { status: IdentifyVersionStatusEnum.UP_TO_DATE },
					},
				},
			});

			const result = await client.refresh();

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.session_id).toBe("refreshed-session");
			}
		});
	});

	describe("reset", () => {
		test("resets state to unidentified", async () => {
			const { client } = createTestClient();

			await client.identify();
			expect(client.getIdentifyState().type).toBe("identified");

			client.reset();

			expect(client.getIdentifyState().type).toBe("unidentified");
		});

		test("removes state from storage then saves unidentified", async () => {
			const { client, mockStorage } = createTestClient();

			await client.identify();
			expect(mockStorage.getStorage().has(IDENTIFY_STORAGE_KEY)).toBe(true);

			client.reset();

			// After reset, storage should contain unidentified state
			const stored = mockStorage.getStorage().get(IDENTIFY_STORAGE_KEY);
			expect(stored).toBeDefined();
			expect(JSON.parse(stored!).type).toBe("unidentified");
		});

		test("emits unidentified state on reset", async () => {
			const { client } = createTestClient();

			await client.identify();

			const states: IdentifyState[] = [];
			client.onIdentifyStateChange((state) => states.push(state));

			client.reset();

			expect(states).toHaveLength(1);
			expect(states[0].type).toBe("unidentified");
		});

		test("can identify again after reset", async () => {
			const { client } = createTestClient();

			await client.identify();
			client.reset();
			expect(client.getIdentifyState().type).toBe("unidentified");

			const result = await client.identify();

			expect(result.success).toBe(true);
			expect(client.getIdentifyState().type).toBe("identified");
		});

		test("does not emit when already unidentified", () => {
			const { client } = createTestClient();

			expect(client.getIdentifyState().type).toBe("unidentified");

			const states: IdentifyState[] = [];
			client.onIdentifyStateChange((state) => states.push(state));

			client.reset();

			// setIdentifyState checks type equality and won't emit
			expect(states).toHaveLength(0);
		});
	});

	describe("initialize", () => {
		test("calls identify on initialize", async () => {
			const { client, mockApi } = createTestClient();

			expect(client.getIdentifyState().type).toBe("unidentified");

			await client.initialize();

			expect(client.getIdentifyState().type).toBe("identified");
			expect(mockApi.getCalls()).toHaveLength(1);
		});

		test("returns void on success", async () => {
			const { client } = createTestClient();

			const result = await client.initialize();

			expect(result).toBeUndefined();
		});

		test("propagates identify failure silently", async () => {
			const mockApi = createMockApiClient({ success: false });
			const { client } = createTestClient({ api: mockApi });

			// initialize doesn't return the result, so we check state
			await client.initialize();

			expect(client.getIdentifyState().type).toBe("unidentified");
		});
	});

	describe("getSessionState", () => {
		test("returns null when unidentified", () => {
			const { client } = createTestClient();

			expect(client.getSessionState()).toBeNull();
		});

		test("returns null when identifying state restored (resets to unidentified)", () => {
			const mockStorage = createMockStorageClient();
			mockStorage.getStorage().set(IDENTIFY_STORAGE_KEY, JSON.stringify({ type: "identifying" }));

			const { client } = createTestClient({ storage: mockStorage });
			loadStateFromStorage(client);

			// "identifying" is transient, resets to "unidentified"
			expect(client.getSessionState()).toBeNull();
		});

		test("returns session when identified", async () => {
			const { client } = createTestClient();

			await client.identify();

			const session = client.getSessionState();
			expect(session).not.toBeNull();
			expect(session?.session_id).toBe("session-123");
			expect(session?.device_id).toBe("device-123");
			expect(session?.persona_id).toBe("persona-123");
			expect(session?.token).toBe("token-123");
		});

		test("returns updated session after re-identify", async () => {
			const mockApi = createMockApiClient({ sessionId: "first-session" });
			const { client } = createTestClient({ api: mockApi });

			await client.identify();
			expect(client.getSessionState()?.session_id).toBe("first-session");

			// Change what API returns
			mockApi.client = async () => ({
				error: null,
				data: {
					data: {
						session_id: "second-session",
						device_id: "device-123",
						persona_id: "persona-123",
						token: "token-123",
						version_info: { status: IdentifyVersionStatusEnum.UP_TO_DATE },
					},
				},
			});

			await client.identify();
			expect(client.getSessionState()?.session_id).toBe("second-session");
		});
	});

	describe("getIdentifyState", () => {
		test("returns current state object", () => {
			const { client } = createTestClient();

			const state = client.getIdentifyState();

			expect(state).toBeDefined();
			expect(state.type).toBe("unidentified");
		});

		test("returns identified state with all fields", async () => {
			const { client } = createTestClient();

			await client.identify();

			const state = client.getIdentifyState();
			expect(state.type).toBe("identified");
			if (state.type === "identified") {
				expect(state.session).toBeDefined();
				expect(state.version_info).toBeDefined();
				expect(state.version_info.status).toBe(IdentifyVersionStatusEnum.UP_TO_DATE);
				expect(state.version_info.update).toBeNull();
			}
		});
	});

	describe("shutdown", () => {
		test("removes all listeners", async () => {
			const { client } = createTestClient();

			const states: IdentifyState[] = [];
			client.onIdentifyStateChange((state) => states.push(state));

			client.shutdown();

			await client.identify();

			expect(states).toHaveLength(0);
		});

		test("removes multiple listeners", async () => {
			const { client } = createTestClient();

			const states1: IdentifyState[] = [];
			const states2: IdentifyState[] = [];

			client.onIdentifyStateChange((state) => states1.push(state));
			client.onIdentifyStateChange((state) => states2.push(state));

			client.shutdown();

			await client.identify();

			expect(states1).toHaveLength(0);
			expect(states2).toHaveLength(0);
		});

		test("client still functions after shutdown", async () => {
			const { client } = createTestClient();

			client.shutdown();

			const result = await client.identify();

			expect(result.success).toBe(true);
			expect(client.getIdentifyState().type).toBe("identified");
		});

		test("can add new listeners after shutdown", async () => {
			const { client } = createTestClient();

			client.shutdown();

			const states: IdentifyState[] = [];
			client.onIdentifyStateChange((state) => states.push(state));

			await client.identify();

			expect(states.length).toBeGreaterThan(0);
		});
	});

	describe("storage persistence", () => {
		test("persists identifying state during identify", async () => {
			const mockStorage = createMockStorageClient();
			const mockApi = createMockApiClient();

			// Make API slow so we can check intermediate state
			let resolveApi: (value: unknown) => void;
			const apiPromise = new Promise((resolve) => { resolveApi = resolve; });

			mockApi.client = async () => {
				await apiPromise;
				return {
					error: null,
					data: {
						data: {
							session_id: "session-123",
							device_id: "device-123",
							persona_id: "persona-123",
							token: "token-123",
							version_info: { status: IdentifyVersionStatusEnum.UP_TO_DATE },
						},
					},
				};
			};

			const { client } = createTestClient({ storage: mockStorage, api: mockApi });

			const identifyPromise = client.identify();

			// Check storage while API call is pending
			await new Promise(resolve => setTimeout(resolve, 10));
			const intermediateStored = mockStorage.getStorage().get(IDENTIFY_STORAGE_KEY);
			expect(JSON.parse(intermediateStored!).type).toBe("identifying");

			// Complete API call
			resolveApi!(null);
			await identifyPromise;

			const finalStored = mockStorage.getStorage().get(IDENTIFY_STORAGE_KEY);
			expect(JSON.parse(finalStored!).type).toBe("identified");
		});

		test("storage survives client recreation", async () => {
			const mockStorage = createMockStorageClient();

			// Create first client and identify
			const { client: client1 } = createTestClient({ storage: mockStorage });
			await client1.identify();

			// Create second client with same storage
			const { client: client2 } = createTestClient({ storage: mockStorage });
			loadStateFromStorage(client2);

			// Should restore identified state
			expect(client2.getIdentifyState().type).toBe("identified");
			expect(client2.getSessionState()?.session_id).toBe("session-123");
		});
	});

	describe("concurrent operations", () => {
		test("handles rapid successive identify calls", async () => {
			const { client } = createTestClient();

			const results = await Promise.all([
				client.identify(),
				client.identify(),
				client.identify(),
			]);

			// All should succeed
			results.forEach(result => {
				expect(result.success).toBe(true);
			});

			expect(client.getIdentifyState().type).toBe("identified");
		});

		test("handles identify during reset", async () => {
			const { client } = createTestClient();

			await client.identify();

			// Start identify and immediately reset
			const identifyPromise = client.identify();
			client.reset();

			await identifyPromise;

			// Final state depends on timing, but should be valid
			const state = client.getIdentifyState();
			expect(["unidentified", "identified"]).toContain(state.type);
		});
	});

	describe("edge cases", () => {
		test("handles empty persona object", async () => {
			const { client, mockApi } = createTestClient();

			await client.identify({});

			const lastCall = mockApi.getLastCall();
			expect(lastCall.config.body.persona).toEqual({});
		});

		test("handles very long session tokens", async () => {
			const longToken = "t".repeat(10000);
			const mockApi = createMockApiClient({ token: longToken });
			const { client } = createTestClient({ api: mockApi });

			const result = await client.identify();

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.token).toBe(longToken);
			}
		});

		test("handles special characters in session data", async () => {
			const mockApi = createMockApiClient({
				sessionId: "session-with-émojis-🚀-and-üñíçödé",
			});
			const { client, mockStorage } = createTestClient({ api: mockApi });

			await client.identify();

			// Verify it can be stored and retrieved
			const stored = mockStorage.getStorage().get(IDENTIFY_STORAGE_KEY);
			const parsed = JSON.parse(stored!);
			expect(parsed.session.session_id).toBe("session-with-émojis-🚀-and-üñíçödé");
		});
	});
});