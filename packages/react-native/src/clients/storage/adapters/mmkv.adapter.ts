import * as MMKV from "react-native-mmkv";
import { StorageAdapter, type SupportedStorage } from "./storage.adpater-interface";


export class MMKVStorageAdapter extends StorageAdapter {
	createStorage(storageKey: string): SupportedStorage {
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
	}

}