import { TeardownCore } from "@teardown/react-native";
import { ExpoDeviceAdapter } from "@teardown/react-native/adapters/expo";
import { MMKVStorageAdapter } from "@teardown/react-native/adapters/mmkv";

export const teardown = new TeardownCore({
	org_id: "de3b02a3-404d-405f-ac95-30150cfba757",
	project_id: "58aca80a-8df7-4df4-975e-91a2b4b5b958",
	api_key: "2d0026d2-4d61-4046-8492-1290fff52944",
	storageAdapter: new MMKVStorageAdapter(),
	deviceAdapter: new ExpoDeviceAdapter(),
	forceUpdate: {
		throttleMs: 30_000, // 30 seconds
		checkCooldownMs: 10_000, // 10 seconds
	},
});