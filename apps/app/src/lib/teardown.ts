import { TeardownCore } from "@teardown/react-native";
import { AsyncStorageAdapter } from "@teardown/react-native/adapters/async-storage";
import { DeviceInfoAdapter } from "@teardown/react-native/adapters/device-info";

export const teardown = new TeardownCore({
	org_id: "de3b02a3-404d-405f-ac95-30150cfba757",
	project_id: "58aca80a-8df7-4df4-975e-91a2b4b5b958",
	api_key: "2d0026d2-4d61-4046-8492-1290fff52944",
	storageAdapter: new AsyncStorageAdapter(),
	deviceAdapter: new DeviceInfoAdapter(),
	forceUpdate: {
		checkCooldownMs: -1,
		throttleMs: -1,
	},
});