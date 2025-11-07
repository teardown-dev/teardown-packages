import { type SupportedStorage, TeardownCore } from "@teardown/react-native";
import * as MMKV from "react-native-mmkv";

const createStorage: SupportedStorageFactory = (storageKey: string) => {
	const storage = MMKV.createMMKV({
		id: storageKey,
	});

	return {
		preload: () => {
			storage.getAllKeys();
		},
		getItem: (key: string) => {
			return storage.getString(key) ?? null;
		},
		setItem: (key: string, value: string) => {
			storage.set(key, value);
		},
		removeItem: (key: string) => {
			storage.remove(key);
		},
		clear: () => {
			storage.clearAll();
		},
		keys: () => {
			return storage.getAllKeys();
		},
	};
};

export const teardown = new TeardownCore({
	api: {
		apiKey: "1234567890",
		orgId: "1234567890",
		projectId: "1234567890",
	},
	storage: {
		createStorage,
	},
});