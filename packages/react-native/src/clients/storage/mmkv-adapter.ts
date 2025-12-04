import type { SupportedStorageFactory } from "./storage.client";
import * as MMKV from "react-native-mmkv";

/**
 * Creates a storage factory that uses MMKV for persistence.
 * Each storage key gets its own MMKV instance.
 */
export const createMMKVStorageFactory = (): SupportedStorageFactory => {
	return (storageKey: string) => {
		const storage = MMKV.createMMKV({ id: storageKey });

		return {
			preload: () => {
				storage.getAllKeys();
			},
			getItem: (key: string) => storage.getString(key) ?? null,
			setItem: (key: string, value: string) => storage.set(key, value),
			removeItem: (key: string) => storage.remove(key),
			clear: () => storage.clearAll(),
			keys: () => storage.getAllKeys(),
		};
	};
};
