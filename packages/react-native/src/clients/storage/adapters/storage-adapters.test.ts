console.log("[DEBUG] storage-adapters.test.ts - Starting module load...");

import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { SupportedStorage } from "./storage.adpater-interface";

/**
 * Mock MMKV storage instance
 */
function createMockMMKVInstance() {
	const store = new Map<string, string>();
	return {
		getString: mock((key: string) => store.get(key)),
		set: mock((key: string, value: string) => {
			store.set(key, value);
		}),
		remove: mock((key: string) => {
			store.delete(key);
		}),
		clearAll: mock(() => {
			store.clear();
		}),
		getAllKeys: mock(() => Array.from(store.keys())),
		_store: store, // expose for test assertions
	};
}

/**
 * Mock AsyncStorage
 */
function createMockAsyncStorage() {
	const store = new Map<string, string>();
	return {
		getAllKeys: mock(async () => Array.from(store.keys())),
		multiGet: mock(async (keys: string[]) => keys.map((k) => [k, store.get(k) ?? null] as [string, string | null])),
		setItem: mock(async (key: string, value: string) => {
			store.set(key, value);
		}),
		removeItem: mock(async (key: string) => {
			store.delete(key);
		}),
		multiRemove: mock(async (keys: string[]) => {
			for (const key of keys) {
				store.delete(key);
			}
		}),
		_store: store,
		_reset: () => {
			store.clear();
		},
	};
}

// Create mock instances
const mockMMKVInstance = createMockMMKVInstance();
const mockAsyncStorage = createMockAsyncStorage();

// Mock the react-native-mmkv module
mock.module("react-native-mmkv", () => ({
	createMMKV: mock(() => mockMMKVInstance),
}));

// Mock the @react-native-async-storage/async-storage module
mock.module("@react-native-async-storage/async-storage", () => ({
	default: mockAsyncStorage,
}));

// Import adapters AFTER mocking
const { MMKVStorageAdapter } = await import("./mmkv.adapter");
const { AsyncStorageAdapter } = await import("./async-storage.adapter");

describe("MMKVStorageAdapter", () => {
	let adapter: InstanceType<typeof MMKVStorageAdapter>;
	let storage: SupportedStorage;

	beforeEach(() => {
		mockMMKVInstance._store.clear();
		mockMMKVInstance.getString.mockClear();
		mockMMKVInstance.set.mockClear();
		mockMMKVInstance.remove.mockClear();
		mockMMKVInstance.clearAll.mockClear();
		mockMMKVInstance.getAllKeys.mockClear();

		adapter = new MMKVStorageAdapter();
		storage = adapter.createStorage("test-store");
	});

	describe("createStorage", () => {
		test("creates storage with correct storageKey", () => {
			const { createMMKV } = require("react-native-mmkv");
			adapter.createStorage("my-app-store");
			expect(createMMKV).toHaveBeenCalledWith({
				id: "my-app-store",
				encryptionKey: "my-app-store",
			});
		});
	});

	describe("preload", () => {
		test("calls getAllKeys to warm up storage", () => {
			storage.preload();
			expect(mockMMKVInstance.getAllKeys).toHaveBeenCalled();
		});

		test("is synchronous (returns void)", () => {
			const result = storage.preload();
			expect(result).toBeUndefined();
		});
	});

	describe("getItem", () => {
		test("returns null for non-existent key", () => {
			expect(storage.getItem("missing")).toBeNull();
		});

		test("returns stored value", () => {
			mockMMKVInstance._store.set("existing", "value");
			expect(storage.getItem("existing")).toBe("value");
		});

		test("converts undefined to null", () => {
			// MMKV returns undefined for missing keys
			expect(storage.getItem("undefined-key")).toBeNull();
		});

		test("handles empty string value", () => {
			mockMMKVInstance._store.set("empty", "");
			expect(storage.getItem("empty")).toBe("");
		});

		test("handles JSON string value", () => {
			const json = JSON.stringify({ nested: { data: [1, 2, 3] } });
			mockMMKVInstance._store.set("json", json);
			expect(storage.getItem("json")).toBe(json);
		});

		test("handles unicode values", () => {
			mockMMKVInstance._store.set("unicode", "日本語テスト🎉");
			expect(storage.getItem("unicode")).toBe("日本語テスト🎉");
		});
	});

	describe("setItem", () => {
		test("stores value", () => {
			storage.setItem("key", "value");
			expect(mockMMKVInstance.set).toHaveBeenCalledWith("key", "value");
		});

		test("overwrites existing value", () => {
			storage.setItem("key", "original");
			storage.setItem("key", "updated");
			expect(mockMMKVInstance._store.get("key")).toBe("updated");
		});

		test("handles empty string key", () => {
			storage.setItem("", "empty-key-value");
			expect(mockMMKVInstance.set).toHaveBeenCalledWith("", "empty-key-value");
		});

		test("handles empty string value", () => {
			storage.setItem("key", "");
			expect(mockMMKVInstance.set).toHaveBeenCalledWith("key", "");
		});

		test("handles large values", () => {
			const largeValue = "x".repeat(10000);
			storage.setItem("large", largeValue);
			expect(mockMMKVInstance.set).toHaveBeenCalledWith("large", largeValue);
		});
	});

	describe("removeItem", () => {
		test("removes existing item", () => {
			mockMMKVInstance._store.set("key", "value");
			storage.removeItem("key");
			expect(mockMMKVInstance.remove).toHaveBeenCalledWith("key");
		});

		test("handles removing non-existent key", () => {
			storage.removeItem("non-existent");
			expect(mockMMKVInstance.remove).toHaveBeenCalledWith("non-existent");
		});
	});

	describe("clear", () => {
		test("clears all items", () => {
			mockMMKVInstance._store.set("key1", "value1");
			mockMMKVInstance._store.set("key2", "value2");
			storage.clear();
			expect(mockMMKVInstance.clearAll).toHaveBeenCalled();
		});

		test("handles clearing empty storage", () => {
			storage.clear();
			expect(mockMMKVInstance.clearAll).toHaveBeenCalled();
		});
	});

	describe("keys", () => {
		test("returns empty array for empty storage", () => {
			expect(storage.keys()).toEqual([]);
		});

		test("returns all keys", () => {
			mockMMKVInstance._store.set("key1", "value1");
			mockMMKVInstance._store.set("key2", "value2");
			const keys = storage.keys();
			expect(keys).toContain("key1");
			expect(keys).toContain("key2");
		});
	});
});

describe("AsyncStorageAdapter", () => {
	let adapter: InstanceType<typeof AsyncStorageAdapter>;
	let storage: SupportedStorage;

	beforeEach(() => {
		mockAsyncStorage._reset();
		mockAsyncStorage.getAllKeys.mockClear();
		mockAsyncStorage.multiGet.mockClear();
		mockAsyncStorage.setItem.mockClear();
		mockAsyncStorage.removeItem.mockClear();
		mockAsyncStorage.multiRemove.mockClear();

		adapter = new AsyncStorageAdapter();
		storage = adapter.createStorage("test-store");
	});

	describe("preload/hydration", () => {
		test("hydrates cache from AsyncStorage", async () => {
			mockAsyncStorage._store.set("test-store:key1", "value1");
			mockAsyncStorage._store.set("test-store:key2", "value2");
			mockAsyncStorage._store.set("other-store:key3", "value3");

			await storage.preload();

			expect(storage.getItem("key1")).toBe("value1");
			expect(storage.getItem("key2")).toBe("value2");
			expect(storage.getItem("key3")).toBeNull(); // different prefix
		});

		test("only hydrates once", async () => {
			await storage.preload();
			await storage.preload();
			await storage.preload();

			expect(mockAsyncStorage.getAllKeys).toHaveBeenCalledTimes(1);
		});

		test("filters keys by storageKey prefix", async () => {
			mockAsyncStorage._store.set("test-store:mykey", "myvalue");
			mockAsyncStorage._store.set("another-store:otherkey", "othervalue");

			await storage.preload();

			expect(mockAsyncStorage.multiGet).toHaveBeenCalledWith(["test-store:mykey"]);
		});

		test("handles AsyncStorage error gracefully", async () => {
			mockAsyncStorage.getAllKeys.mockImplementationOnce(async () => {
				throw new Error("Storage error");
			});

			// Should not throw
			await storage.preload();

			// Cache remains empty
			expect(storage.keys()).toEqual([]);
		});

		test("sets hydrated flag even on error", async () => {
			mockAsyncStorage.getAllKeys.mockImplementationOnce(async () => {
				throw new Error("Storage error");
			});

			await storage.preload();
			// Second call should not hit AsyncStorage
			await storage.preload();

			expect(mockAsyncStorage.getAllKeys).toHaveBeenCalledTimes(1);
		});

		test("handles null values from multiGet", async () => {
			mockAsyncStorage._store.set("test-store:key1", "value1");
			mockAsyncStorage.multiGet.mockImplementationOnce(async () => [
				["test-store:key1", "value1"],
				["test-store:key2", null], // null value
			]);

			await storage.preload();

			expect(storage.getItem("key1")).toBe("value1");
			expect(storage.getItem("key2")).toBeNull();
		});
	});

	describe("getItem", () => {
		test("returns null before preload", () => {
			mockAsyncStorage._store.set("test-store:key", "value");
			expect(storage.getItem("key")).toBeNull();
		});

		test("returns cached value after preload", async () => {
			mockAsyncStorage._store.set("test-store:key", "value");
			await storage.preload();
			expect(storage.getItem("key")).toBe("value");
		});

		test("returns value set before preload", () => {
			storage.setItem("key", "value");
			expect(storage.getItem("key")).toBe("value");
		});

		test("returns null for non-existent key", async () => {
			await storage.preload();
			expect(storage.getItem("missing")).toBeNull();
		});
	});

	describe("setItem", () => {
		test("stores value in cache immediately", () => {
			storage.setItem("key", "value");
			expect(storage.getItem("key")).toBe("value");
		});

		test("persists to AsyncStorage with prefixed key", async () => {
			storage.setItem("key", "value");
			// Wait for async operation
			await new Promise((resolve) => setTimeout(resolve, 10));
			expect(mockAsyncStorage.setItem).toHaveBeenCalledWith("test-store:key", "value");
		});

		test("overwrites existing value", async () => {
			storage.setItem("key", "original");
			storage.setItem("key", "updated");

			expect(storage.getItem("key")).toBe("updated");
			await new Promise((resolve) => setTimeout(resolve, 10));
			expect(mockAsyncStorage.setItem).toHaveBeenLastCalledWith("test-store:key", "updated");
		});

		test("handles AsyncStorage error gracefully", async () => {
			mockAsyncStorage.setItem.mockImplementationOnce(async () => {
				throw new Error("Write error");
			});

			// Should not throw
			storage.setItem("key", "value");

			// Value should still be in cache
			expect(storage.getItem("key")).toBe("value");
		});
	});

	describe("removeItem", () => {
		test("removes from cache immediately", async () => {
			await storage.preload();
			storage.setItem("key", "value");
			storage.removeItem("key");
			expect(storage.getItem("key")).toBeNull();
		});

		test("removes from AsyncStorage with prefixed key", async () => {
			storage.setItem("key", "value");
			storage.removeItem("key");
			await new Promise((resolve) => setTimeout(resolve, 10));
			expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith("test-store:key");
		});

		test("handles removing non-existent key", async () => {
			storage.removeItem("non-existent");
			await new Promise((resolve) => setTimeout(resolve, 10));
			expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith("test-store:non-existent");
		});

		test("handles AsyncStorage error gracefully", async () => {
			mockAsyncStorage.removeItem.mockImplementationOnce(async () => {
				throw new Error("Remove error");
			});

			storage.setItem("key", "value");
			// Should not throw
			storage.removeItem("key");

			// Value should be removed from cache
			expect(storage.getItem("key")).toBeNull();
		});
	});

	describe("clear", () => {
		test("clears cache immediately", async () => {
			storage.setItem("key1", "value1");
			storage.setItem("key2", "value2");
			storage.clear();

			expect(storage.keys()).toEqual([]);
			expect(storage.getItem("key1")).toBeNull();
			expect(storage.getItem("key2")).toBeNull();
		});

		test("calls multiRemove with prefixed keys", async () => {
			storage.setItem("key1", "value1");
			storage.setItem("key2", "value2");
			storage.clear();

			await new Promise((resolve) => setTimeout(resolve, 10));
			expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith(
				expect.arrayContaining(["test-store:key1", "test-store:key2"])
			);
		});

		test("handles clearing empty storage", async () => {
			storage.clear();
			await new Promise((resolve) => setTimeout(resolve, 10));
			expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([]);
		});

		test("handles AsyncStorage error gracefully", async () => {
			mockAsyncStorage.multiRemove.mockImplementationOnce(async () => {
				throw new Error("Clear error");
			});

			storage.setItem("key", "value");
			// Should not throw
			storage.clear();

			// Cache should still be cleared
			expect(storage.keys()).toEqual([]);
		});
	});

	describe("keys", () => {
		test("returns empty array for empty cache", () => {
			expect(storage.keys()).toEqual([]);
		});

		test("returns keys from cache", () => {
			storage.setItem("key1", "value1");
			storage.setItem("key2", "value2");
			const keys = storage.keys();
			expect(keys).toHaveLength(2);
			expect(keys).toContain("key1");
			expect(keys).toContain("key2");
		});

		test("reflects removals", () => {
			storage.setItem("key1", "value1");
			storage.setItem("key2", "value2");
			storage.removeItem("key1");
			expect(storage.keys()).toEqual(["key2"]);
		});

		test("returns unprefixed keys", async () => {
			mockAsyncStorage._store.set("test-store:prefixed-key", "value");
			await storage.preload();
			expect(storage.keys()).toContain("prefixed-key");
		});
	});

	describe("key prefixing isolation", () => {
		test("different storageKeys are isolated", async () => {
			mockAsyncStorage._store.set("store-a:key", "value-a");
			mockAsyncStorage._store.set("store-b:key", "value-b");

			const storageA = adapter.createStorage("store-a");
			const storageB = adapter.createStorage("store-b");

			await storageA.preload();
			await storageB.preload();

			expect(storageA.getItem("key")).toBe("value-a");
			expect(storageB.getItem("key")).toBe("value-b");
		});

		test("clear only affects own storageKey", async () => {
			const storageA = adapter.createStorage("store-a");
			const storageB = adapter.createStorage("store-b");

			storageA.setItem("key", "value-a");
			storageB.setItem("key", "value-b");

			storageA.clear();

			expect(storageA.getItem("key")).toBeNull();
			expect(storageB.getItem("key")).toBe("value-b");
		});
	});
});

describe("Edge Cases", () => {
	describe("MMKVStorageAdapter edge cases", () => {
		let storage: SupportedStorage;

		beforeEach(() => {
			mockMMKVInstance._store.clear();
			mockMMKVInstance.set.mockClear();
			const adapter = new MMKVStorageAdapter();
			storage = adapter.createStorage("edge-test");
		});

		test("handles special characters in keys", () => {
			storage.setItem("key:with/special-chars", "value");
			expect(mockMMKVInstance.set).toHaveBeenCalledWith("key:with/special-chars", "value");
		});

		test("handles newlines in values", () => {
			storage.setItem("multiline", "line1\nline2\r\nline3");
			expect(mockMMKVInstance._store.get("multiline")).toBe("line1\nline2\r\nline3");
		});

		test("handles rapid successive operations", () => {
			for (let i = 0; i < 100; i++) {
				storage.setItem(`key-${i}`, `value-${i}`);
			}
			expect(mockMMKVInstance.set).toHaveBeenCalledTimes(100);
		});
	});

	describe("AsyncStorageAdapter edge cases", () => {
		let storage: SupportedStorage;

		beforeEach(() => {
			mockAsyncStorage._reset();
			const adapter = new AsyncStorageAdapter();
			storage = adapter.createStorage("edge-test");
		});

		test("handles special characters in keys (properly prefixed)", async () => {
			storage.setItem("key:with/special-chars", "value");
			await new Promise((resolve) => setTimeout(resolve, 10));
			expect(mockAsyncStorage.setItem).toHaveBeenCalledWith("edge-test:key:with/special-chars", "value");
		});

		test("handles keys that look like prefixed keys", async () => {
			// Key that contains colon similar to prefix format
			storage.setItem("other:nested:key", "value");
			expect(storage.getItem("other:nested:key")).toBe("value");
		});

		test("setItem works before preload completes", () => {
			// Start preload but don't await
			storage.preload();
			storage.setItem("key", "value");

			// Should be immediately available in cache
			expect(storage.getItem("key")).toBe("value");
		});

		test("handles concurrent operations", async () => {
			for (let i = 0; i < 50; i++) {
				storage.setItem(`key-${i}`, `value-${i}`);
			}

			await new Promise((resolve) => setTimeout(resolve, 50));

			for (let i = 0; i < 50; i++) {
				expect(storage.getItem(`key-${i}`)).toBe(`value-${i}`);
			}
		});

		test("cache survives failed preload", async () => {
			// Set value before preload
			storage.setItem("cached", "value");

			// Force preload to fail
			mockAsyncStorage.getAllKeys.mockImplementationOnce(async () => {
				throw new Error("Network error");
			});

			await storage.preload();

			// Cached value should still be there
			expect(storage.getItem("cached")).toBe("value");
		});
	});
});

console.log("[DEBUG] storage-adapters.test.ts - Tests registered successfully");
