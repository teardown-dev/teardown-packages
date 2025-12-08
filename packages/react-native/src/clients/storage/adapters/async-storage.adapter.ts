import * as MMKV from "react-native-mmkv";
import { StorageAdapter, type SupportedStorage } from "./storage.adpater-interface";
import AsyncStorage from "@react-native-async-storage/async-storage";


/**
 * Creates a SupportedStorage adapter backed by AsyncStorage.
 *
 * Since SupportedStorage interface is synchronous but AsyncStorage is async,
 * this adapter uses an in-memory cache for sync access. Writes are persisted
 * to AsyncStorage asynchronously.
 *
 * Call `preload()` after creation to hydrate the cache from AsyncStorage.
 * Until hydration completes, reads return null for persisted values.
 */

export class MMKVStorageAdapter extends StorageAdapter {
	createStorage(storageKey: string): SupportedStorage {
		let cache: Record<string, string> = {};
		let hydrated = false;

		const prefixedKey = (key: string): string => `${storageKey}:${key}`;

		return {
			preload: () => {
				if (hydrated) return;

				// Fire async hydration - cache will be populated when complete
				AsyncStorage.getAllKeys()
					.then((allKeys) => {
						const relevantKeys = allKeys.filter((k) =>
							k.startsWith(`${storageKey}:`)
						);
						return AsyncStorage.multiGet(relevantKeys);
					})
					.then((pairs) => {
						for (const [fullKey, value] of pairs) {
							if (value != null) {
								const key = fullKey.replace(`${storageKey}:`, "");
								cache[key] = value;
							}
						}
						hydrated = true;
					})
					.catch(() => {
						// Silently fail - cache remains empty
					});
			},

			getItem: (key: string): string | null => {
				return cache[key] ?? null;
			},

			setItem: (key: string, value: string): void => {
				cache[key] = value;
				AsyncStorage.setItem(prefixedKey(key), value).catch(() => {
					// Silently fail - value remains in cache
				});
			},

			removeItem: (key: string): void => {
				delete cache[key];
				AsyncStorage.removeItem(prefixedKey(key)).catch(() => {
					// Silently fail
				});
			},

			clear: (): void => {
				const keysToRemove = Object.keys(cache).map(prefixedKey);
				cache = {};
				AsyncStorage.multiRemove(keysToRemove).catch(() => {
					// Silently fail
				});
			},

			keys: (): string[] => {
				return Object.keys(cache);
			},
		};
	}

}