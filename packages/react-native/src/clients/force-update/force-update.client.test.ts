import { describe, test, expect, beforeEach, mock } from "bun:test";
import { EventEmitter } from "eventemitter3";

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

// Import after mock
const { ForceUpdateClient, IdentifyVersionStatusEnum } = await import("./force-update.client");
type IdentifyState = import("../identity").IdentifyState;
type IdentifyStateChangeEvents = import("../identity").IdentifyStateChangeEvents;
type VersionStatus = import("./force-update.client").VersionStatus;

function createMockIdentityClient() {
	const emitter = new EventEmitter<IdentifyStateChangeEvents>();
	let identifyCallCount = 0;
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
		identify: async () => {
			identifyCallCount++;
			emitter.emit("IDENTIFY_STATE_CHANGED", { type: "identifying" });
			emitter.emit("IDENTIFY_STATE_CHANGED", {
				type: "identified",
				session: { session_id: "s1", device_id: "d1", persona_id: "p1", token: "t1" },
				version_info: { status: nextIdentifyResult.data?.version_info.status ?? IdentifyVersionStatusEnum.UP_TO_DATE, update: null },
			});
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

	describe("updateFromVersionStatus single emission", () => {
		test("emits VERSION_STATUS_CHANGED exactly once per identify cycle", async () => {
			const mockIdentity = createMockIdentityClient();
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();

			const client = new ForceUpdateClient(
				mockLogging as never,
				mockStorage as never,
				mockIdentity as never,
				{ throttleMs: 0, checkCooldownMs: 0 }
			);

			const statusChanges: VersionStatus[] = [];
			client.onVersionStatusChange((status) => statusChanges.push(status));

			// Trigger identify via state change
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
				{ throttleMs: 0, checkCooldownMs: 0 }
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

	describe("throttle and cooldown", () => {
		test("throttle prevents rapid foreground checks", async () => {
			const mockIdentity = createMockIdentityClient();
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();

			const client = new ForceUpdateClient(
				mockLogging as never,
				mockStorage as never,
				mockIdentity as never,
				{ throttleMs: 1000, checkCooldownMs: 0 }
			);

			const foregroundHandler = mockAppStateListeners[0];

			// First foreground
			await foregroundHandler("active");
			await new Promise((r) => setTimeout(r, 10));

			const callsAfterFirst = mockIdentity.getIdentifyCallCount();

			// Second foreground immediately (within throttle window)
			await foregroundHandler("active");
			await new Promise((r) => setTimeout(r, 10));

			const callsAfterSecond = mockIdentity.getIdentifyCallCount();

			// Should only have one identify call due to throttle
			expect(callsAfterFirst).toBe(1);
			expect(callsAfterSecond).toBe(1);

			client.shutdown();
		});

		test("cooldown prevents redundant checks after recent success", async () => {
			const mockIdentity = createMockIdentityClient();
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();

			const client = new ForceUpdateClient(
				mockLogging as never,
				mockStorage as never,
				mockIdentity as never,
				{ throttleMs: 0, checkCooldownMs: 5000 }
			);

			const foregroundHandler = mockAppStateListeners[0];

			// First foreground - should trigger check
			await foregroundHandler("active");
			await new Promise((r) => setTimeout(r, 10));

			const callsAfterFirst = mockIdentity.getIdentifyCallCount();

			// Second foreground (within cooldown window)
			await foregroundHandler("active");
			await new Promise((r) => setTimeout(r, 10));

			const callsAfterSecond = mockIdentity.getIdentifyCallCount();

			// Only first call should have triggered identify (cooldown blocks second)
			expect(callsAfterFirst).toBe(1);
			expect(callsAfterSecond).toBe(1);

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
