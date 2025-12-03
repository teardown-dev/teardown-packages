import { TeardownProvider } from "@teardown/react-native";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { FullscreenTakeover } from "../components/fullscreen-takeover";
import { teardown } from "../lib/teardown";
import "../styles/global.css";

export default function RootLayout() {
	return (
		<SafeAreaProvider>
			<TeardownProvider core={teardown}>
				<Stack screenOptions={{ headerShown: false }} />
				<FullscreenTakeover />
			</TeardownProvider>
		</SafeAreaProvider>
	);
}
