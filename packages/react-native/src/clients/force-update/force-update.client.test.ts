import { describe, test, expect, beforeEach, mock } from "bun:test";
import { EventEmitter } from "eventemitter3";
import { ForceUpdateClient, IdentifyVersionStatusEnum } from "./force-update.client";

// Must mock react-native BEFORE any imports that use it
const mockAppStateListeners: ((state: string) => void)[] = [];
mock.module("react-native", () => ({
	AppState: {
		addEventListener: (_event: string, handler: (state: string) => void) => {
			mockAppStateListeners.push(handler);
			return { remove: () => mockAppStateListeners.splice(mockAppStateListeners.indexOf(handler), 1) };
		},
	},
}));

type IdentifyState = import("../identity").IdentifyState;
type IdentifyStateChangeEvents = import("../identity").IdentifyStateChangeEvents;
type VersionStatus = import("./force-update.client").VersionStatus;

function createMockIdentityClient(initialState?: IdentifyState) {
	const emitter = new EventEmitter<IdentifyStateChangeEvents>();
	let identifyCallCount = 0;
	let currentState: IdentifyState = initialState ?? { type: "unidentified" };
	let nextIdentifyResult: { success: boolean; data?: { version_info: { status: IdentifyVersionStatusEnum } } } = {
		success: true,
		data: { version_info: { status: IdentifyVersionStatusEnum.UP_TO_DATE } },
	};

	return {
		emitter,
		onIdentifyStateChange: (listener: (state: IdentifyState) => void) => {
			emitter.addListener("IDENTIFY_STATE_CHANGED", listener);
			return () => emitter.removeListener("IDENTIFY_STATE_CHANGED", listener);
		},
		getIdentifyState: () => currentState,
		identify: async () => {
			identifyCallCount++;
			currentState = { type: "identifying" };
			emitter.emit("IDENTIFY_STATE_CHANGED", currentState);
			currentState = {
				type: "identified",
				session: { session_id: "s1", device_id: "d1", persona_id: "p1", token: "t1" },
				version_info: { status: nextIdentifyResult.data?.version_info.status ?? IdentifyVersionStatusEnum.UP_TO_DATE, update: null },
			};
			emitter.emit("IDENTIFY_STATE_CHANGED", currentState);
			return nextIdentifyResult;
		},
		getIdentifyCallCount: () => identifyCallCount,
		setNextIdentifyResult: (result: typeof nextIdentifyResult) => {
			nextIdentifyResult = result;
		},
	};
}

function createMockLoggingClient() {
	return {
		createLogger: () => ({
			info: () => { },
			warn: () => { },
			error: () => { },
			debug: () => { },
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
	};
}

describe("ForceUpdateClient", () => {
	beforeEach(() => {
		mockAppStateListeners.length = 0;
	});

	describe("initialization from current identity state", () => {
		test("initializes version status when identity is already identified", () => {
			const mockIdentity = createMockIdentityClient({
				type: "identified",
				session: { session_id: "s1", device_id: "d1", persona_id: "p1", token: "t1" },
				version_info: { status: IdentifyVersionStatusEnum.UPDATE_REQUIRED, update: null },
			});
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();

			const client = new ForceUpdateClient(
				mockLogging as never,
				mockStorage as never,
				mockIdentity as never
			);

			// Should immediately have update_required status from initialization
			expect(client.getVersionStatus().type).toBe("update_required");

			client.shutdown();
		});

		test("stays in initializing when identity is unidentified", () => {
			const mockIdentity = createMockIdentityClient({ type: "unidentified" });
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();

			const client = new ForceUpdateClient(
				mockLogging as never,
				mockStorage as never,
				mockIdentity as never
			);

			// Should stay in initializing since not yet identified
			expect(client.getVersionStatus().type).toBe("initializing");

			client.shutdown();
		});

		test("emits status change during initialization when already identified", () => {
			const mockIdentity = createMockIdentityClient({
				type: "identified",
				session: { session_id: "s1", device_id: "d1", persona_id: "p1", token: "t1" },
				version_info: { status: IdentifyVersionStatusEnum.UP_TO_DATE, update: null },
			});
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();

			const statusChanges: VersionStatus[] = [];

			const client = new ForceUpdateClient(
				mockLogging as never,
				mockStorage as never,
				mockIdentity as never
			);

			// Subscribe after construction to verify initial status was set
			client.onVersionStatusChange((status) => statusChanges.push(status));

			// Trigger another identify to verify no duplicate
			mockIdentity.emitter.emit("IDENTIFY_STATE_CHANGED", {
				type: "identified",
				session: { session_id: "s1", device_id: "d1", persona_id: "p1", token: "t1" },
				version_info: { status: IdentifyVersionStatusEnum.UP_TO_DATE, update: null },
			});

			// Should only have one change from the second emit (initial was before subscription)
			expect(statusChanges).toHaveLength(1);
			expect(client.getVersionStatus().type).toBe("up_to_date");

			client.shutdown();
		});
	});

	describe("updateFromVersionStatus single emission", () => {
		test("emits VERSION_STATUS_CHANGED exactly once per identify cycle", async () => {
			const mockIdentity = createMockIdentityClient();
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();

			const client = new ForceUpdateClient(
				mockLogging as never,
				mockStorage as never,
				mockIdentity as never,
				{ checkOnForeground: true }
			);

			const statusChanges: VersionStatus[] = [];
			client.onVersionStatusChange((status) => statusChanges.push(status));

			// Trigger identify via identify state change
			mockIdentity.emitter.emit("IDENTIFY_STATE_CHANGED", { type: "identifying" });
			mockIdentity.emitter.emit("IDENTIFY_STATE_CHANGED", {
				type: "identified",
				session: { session_id: "s1", device_id: "d1", persona_id: "p1", token: "t1" },
				version_info: { status: IdentifyVersionStatusEnum.UPDATE_AVAILABLE, update: null },
			});

			// Should have: checking (from identifying) + update_available (from identified)
			expect(statusChanges).toHaveLength(2);
			expect(statusChanges[0]).toEqual({ type: "checking" });
			expect(statusChanges[1]).toEqual({ type: "update_available" });

			client.shutdown();
		});

		test("foreground check triggers only one status update via subscription", async () => {
			const mockIdentity = createMockIdentityClient();
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();

			mockIdentity.setNextIdentifyResult({
				success: true,
				data: { version_info: { status: IdentifyVersionStatusEnum.UPDATE_REQUIRED } },
			});

			const client = new ForceUpdateClient(
				mockLogging as never,
				mockStorage as never,
				mockIdentity as never,
				{ checkOnForeground: true }
			);

			const statusChanges: VersionStatus[] = [];
			client.onVersionStatusChange((status) => statusChanges.push(status));

			// Simulate app coming to foreground
			const foregroundHandler = mockAppStateListeners[0];
			expect(foregroundHandler).toBeDefined();

			await foregroundHandler("active");

			// Wait for async identify to complete
			await new Promise((r) => setTimeout(r, 10));

			// Should have: checking + update_required (NOT duplicated)
			expect(statusChanges).toHaveLength(2);
			expect(statusChanges[0]).toEqual({ type: "checking" });
			expect(statusChanges[1]).toEqual({ type: "update_required" });

			client.shutdown();
		});
	});

	describe("cleanup on shutdown", () => {
		test("removes all listeners on shutdown", () => {
			const mockIdentity = createMockIdentityClient();
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();

			const client = new ForceUpdateClient(
				mockLogging as never,
				mockStorage as never,
				mockIdentity as never
			);

			const statusChanges: VersionStatus[] = [];
			client.onVersionStatusChange((status) => statusChanges.push(status));

			client.shutdown();

			// After shutdown, emitting should not trigger listener
			mockIdentity.emitter.emit("IDENTIFY_STATE_CHANGED", {
				type: "identified",
				session: { session_id: "s1", device_id: "d1", persona_id: "p1", token: "t1" },
				version_info: { status: IdentifyVersionStatusEnum.UPDATE_AVAILABLE, update: null },
			});

			// No new status changes after shutdown
			expect(statusChanges).toHaveLength(0);
		});

		test("removes AppState listener on shutdown", () => {
			const mockIdentity = createMockIdentityClient();
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();

			const client = new ForceUpdateClient(
				mockLogging as never,
				mockStorage as never,
				mockIdentity as never
			);

			expect(mockAppStateListeners).toHaveLength(1);

			client.shutdown();

			expect(mockAppStateListeners).toHaveLength(0);
		});
	});

	describe("checkIntervalMs and checkOnForeground", () => {
		test("checkOnForeground: true always checks on foreground", async () => {
			const mockIdentity = createMockIdentityClient();
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();

			const client = new ForceUpdateClient(
				mockLogging as never,
				mockStorage as never,
				mockIdentity as never,
				{ checkOnForeground: true }
			);

			const foregroundHandler = mockAppStateListeners[0];

			// First foreground
			await foregroundHandler("active");
			await new Promise((r) => setTimeout(r, 10));

			const callsAfterFirst = mockIdentity.getIdentifyCallCount();

			// Second foreground immediately
			await foregroundHandler("active");
			await new Promise((r) => setTimeout(r, 10));

			const callsAfterSecond = mockIdentity.getIdentifyCallCount();

			// Both should trigger identify calls with checkOnForeground: true
			expect(callsAfterFirst).toBe(1);
			expect(callsAfterSecond).toBe(2);

			client.shutdown();
		});

		test("checkOnForeground: false respects checkIntervalMs", async () => {
			const mockIdentity = createMockIdentityClient();
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();

			const client = new ForceUpdateClient(
				mockLogging as never,
				mockStorage as never,
				mockIdentity as never,
				{ checkOnForeground: false, checkIntervalMs: 60_000 }
			);

			const foregroundHandler = mockAppStateListeners[0];

			// First foreground - should trigger check
			await foregroundHandler("active");
			await new Promise((r) => setTimeout(r, 10));

			const callsAfterFirst = mockIdentity.getIdentifyCallCount();

			// Second foreground (within interval window)
			await foregroundHandler("active");
			await new Promise((r) => setTimeout(r, 10));

			const callsAfterSecond = mockIdentity.getIdentifyCallCount();

			// Only first call should have triggered identify (interval blocks second)
			expect(callsAfterFirst).toBe(1);
			expect(callsAfterSecond).toBe(1);

			client.shutdown();
		});

		test("checkIntervalMs values below 30s are coerced to 30s", () => {
			const mockIdentity = createMockIdentityClient();
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();

			const client = new ForceUpdateClient(
				mockLogging as never,
				mockStorage as never,
				mockIdentity as never,
				{ checkIntervalMs: 5_000 } // 5 seconds - should be coerced to 30s
			);

			// Access private options via any cast to verify coercion
			const options = (client as unknown as { options: { checkIntervalMs: number } }).options;
			expect(options.checkIntervalMs).toBe(30_000);

			client.shutdown();
		});
	});

	describe("version status mapping", () => {
		test.each([
			[IdentifyVersionStatusEnum.UP_TO_DATE, "up_to_date"],
			[IdentifyVersionStatusEnum.UPDATE_AVAILABLE, "update_available"],
			[IdentifyVersionStatusEnum.UPDATE_REQUIRED, "update_required"],
			[IdentifyVersionStatusEnum.UPDATE_RECOMMENDED, "update_recommended"],
			[IdentifyVersionStatusEnum.DISABLED, "disabled"],
		])("maps %s to %s", (apiStatus, expectedType) => {
			const mockIdentity = createMockIdentityClient();
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();

			const client = new ForceUpdateClient(
				mockLogging as never,
				mockStorage as never,
				mockIdentity as never
			);

			const statusChanges: VersionStatus[] = [];
			client.onVersionStatusChange((status) => statusChanges.push(status));

			mockIdentity.emitter.emit("IDENTIFY_STATE_CHANGED", {
				type: "identified",
				session: { session_id: "s1", device_id: "d1", persona_id: "p1", token: "t1" },
				version_info: { status: apiStatus, update: null },
			});

			expect(statusChanges[statusChanges.length - 1]?.type).toBe(expectedType);

			client.shutdown();
		});
	});
});
