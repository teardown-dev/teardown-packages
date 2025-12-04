import { TeardownCore } from "@teardown/react-native";
import { ExpoDeviceAdapter } from "@teardown/react-native/expo";
import { createMMKVStorageFactory } from "@teardown/react-native/mmkv";

export const teardown = new TeardownCore({
	org_id: "de3b02a3-404d-405f-ac95-30150cfba757",
	project_id: "2f8454cf-7dd0-4eee-9752-ab58d41c8365",
	api_key: "9b206204-f045-456e-a6db-4787c2149cd7",
	storageFactory: createMMKVStorageFactory(),
	deviceAdapter: new ExpoDeviceAdapter(),
	forceUpdate: {
		throttleMs: 30_000, // 30 seconds
		checkCooldownMs: 10_000, // 30 seconds
	},
});
