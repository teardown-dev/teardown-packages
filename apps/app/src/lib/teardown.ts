import { type SupportedStorageFactory, TeardownCore } from "@teardown/react-native";
import { ExpoDeviceAdapter } from "@teardown/react-native/expo";
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

export const global_storage = MMKV.createMMKV({
	id: "teardown",
});

export const teardown = new TeardownCore({
	api: {
		org_id: "de3b02a3-404d-405f-ac95-30150cfba757",
		project_id: "2f8454cf-7dd0-4eee-9752-ab58d41c8365",
		api_key: "9b206204-f045-456e-a6db-4787c2149cd7",
		environment_slug: "development",
	},
	storage: {
		createStorage,
	},
	device: {
		adapter: new ExpoDeviceAdapter(),
	},
	forceUpdate: {
		throttleMs: 30_000, // 30 seconds
		checkCooldownMs: 30_000, // 30 seconds
		identifyAnonymousDevice: true,
	},
});
