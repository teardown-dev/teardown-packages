import { TeardownCore } from "@teardown/react-native";
import { AsyncStorageAdapter } from "@teardown/react-native/adapters/async-storage";
import { DeviceInfoAdapter } from "@teardown/react-native/adapters/device-info";
import { ExpoNotificationsAdapter } from "@teardown/react-native/expo";

// Use env var for physical device testing, fallback to localhost for simulators
const ingestUrl = process.env.EXPO_PUBLIC_INGEST_URL ?? "http://localhost:4501";

export const teardown = new TeardownCore({
	org_id: "7443b2d0-12f6-420f-b0c1-81424503d064",
	project_id: "b4bce092-0039-4d05-8a04-90a4af26af54",
	api_key: "d3d0e237-905d-472b-b599-c434b4846985",
	environment_slug: "production",
	ingestUrl,
	storageAdapter: new AsyncStorageAdapter(),
	deviceAdapter: new DeviceInfoAdapter(),
	notificationAdapter: new ExpoNotificationsAdapter(),
	forceUpdate: {
		checkIntervalMs: 0,
	},
});
