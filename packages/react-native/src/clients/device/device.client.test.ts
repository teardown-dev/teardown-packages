console.log("[DEBUG] device.client.test.ts - Starting module load...");

import { describe, expect, test } from "bun:test";
import type { DeviceInfo } from "@teardown/schemas";
import type { DeviceInfoAdapter } from "./adapters/device.adpater-interface";
import { DeviceClient } from "./device.client";

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
	let uuidCounter = 0;
	return {
		generateRandomUUID: async () => `mock-uuid-${++uuidCounter}`,
		getUuidCounter: () => uuidCounter,
	};
}

function createMockDeviceAdapter(): DeviceInfoAdapter {
	const mockDeviceInfo: DeviceInfo = {
		application: {
			name: "TestApp",
			version: "1.0.0",
			build: "100",
			bundle_id: "com.test.app",
		},
		hardware: {
			brand: "Apple",
			model: "iPhone 15",
			device_type: "PHONE",
		},
		os: {
			name: "iOS",
			version: "17.0",
		},
		update: null,
	};

	return {
		applicationInfo: mockDeviceInfo.application,
		hardwareInfo: mockDeviceInfo.hardware,
		osInfo: mockDeviceInfo.os,
		getDeviceInfo: async () => mockDeviceInfo,
	} as DeviceInfoAdapter;
}

describe("DeviceClient", () => {
	describe("getDeviceId", () => {
		test("generates new UUID when no device ID stored", async () => {
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();
			const mockUtils = createMockUtilsClient();
			const mockAdapter = createMockDeviceAdapter();

			const client = new DeviceClient(mockLogging as never, mockUtils as never, mockStorage as never, {
				adapter: mockAdapter,
			});

			const deviceId = await client.getDeviceId();

			expect(deviceId).toBe("mock-uuid-1");
			expect(mockUtils.getUuidCounter()).toBe(1);
		});

		test("returns stored device ID when available", async () => {
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();
			const mockUtils = createMockUtilsClient();
			const mockAdapter = createMockDeviceAdapter();

			// Pre-populate storage with a device ID
			mockStorage.getStorage().set("deviceId", "existing-device-id");

			const client = new DeviceClient(mockLogging as never, mockUtils as never, mockStorage as never, {
				adapter: mockAdapter,
			});

			const deviceId = await client.getDeviceId();

			expect(deviceId).toBe("existing-device-id");
			// Should not have generated a new UUID
			expect(mockUtils.getUuidCounter()).toBe(0);
		});

		test("returns consistent device ID on multiple calls", async () => {
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();
			const mockUtils = createMockUtilsClient();
			const mockAdapter = createMockDeviceAdapter();

			mockStorage.getStorage().set("deviceId", "consistent-id");

			const client = new DeviceClient(mockLogging as never, mockUtils as never, mockStorage as never, {
				adapter: mockAdapter,
			});

			const id1 = await client.getDeviceId();
			const id2 = await client.getDeviceId();
			const id3 = await client.getDeviceId();

			expect(id1).toBe("consistent-id");
			expect(id2).toBe("consistent-id");
			expect(id3).toBe("consistent-id");
		});
	});

	describe("getDeviceInfo", () => {
		test("returns device info from adapter", async () => {
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();
			const mockUtils = createMockUtilsClient();
			const mockAdapter = createMockDeviceAdapter();

			const client = new DeviceClient(mockLogging as never, mockUtils as never, mockStorage as never, {
				adapter: mockAdapter,
			});

			const deviceInfo = await client.getDeviceInfo();

			expect(deviceInfo.application.name).toBe("TestApp");
			expect(deviceInfo.application.version).toBe("1.0.0");
			expect(deviceInfo.hardware.brand).toBe("Apple");
			expect(deviceInfo.hardware.model).toBe("iPhone 15");
			expect(deviceInfo.os.name).toBe("iOS");
			expect(deviceInfo.os.version).toBe("17.0");
		});

		test("delegates to adapter getDeviceInfo", async () => {
			const mockLogging = createMockLoggingClient();
			const mockStorage = createMockStorageClient();
			const mockUtils = createMockUtilsClient();

			let getDeviceInfoCalled = false;
			const customAdapter = {
				getDeviceInfo: async () => {
					getDeviceInfoCalled = true;
					return {
						application: { name: "Custom", version: "2.0.0", build: "200", bundle_id: "com.custom" },
						hardware: { brand: "Custom", model: "Device", device_type: "TABLET" },
						os: { name: "CustomOS", version: "1.0" },
						notifications: { push_token: null, platform: null },
						update: null,
					};
				},
			} as DeviceInfoAdapter;

			const client = new DeviceClient(mockLogging as never, mockUtils as never, mockStorage as never, {
				adapter: customAdapter,
			});

			const deviceInfo = await client.getDeviceInfo();

			expect(getDeviceInfoCalled).toBe(true);
			expect(deviceInfo.application.name).toBe("Custom");
		});
	});
});

console.log("[DEBUG] device.client.test.ts - Tests registered successfully");
