import { TeardownCore, SupportedStorageFactory } from "@teardown/react-native";
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
		orgId: "5bd67d0d-d2f8-4aa2-bf6b-a0b5e05f82b9",
		projectId: "ae090978-4034-4f77-9ff6-316b28513b8d",
		apiKey: "3c0f0f23-560d-4f09-88c0-3462e8ee82e9",
	},
	storage: {
		createStorage,
	},
	device: {
		// adapter: new ExpoDeviceAdapter(),
	},
	identity: {
		// storage: createStorage("identity"),
	},
});
