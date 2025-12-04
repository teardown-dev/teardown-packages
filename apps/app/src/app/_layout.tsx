/** biome-ignore-all lint/complexity/noUselessFragments: allow for now */
import "../styles/global.css";
import { Stack } from "expo-router";
import { TeardownProvider } from "@teardown/react-native";
import { teardown } from "../lib/teardown";
import { FullscreenTakeover } from "../components/fullscreen-takeover";


export default function RootLayout() {
	return (
		<>
			<TeardownProvider core={teardown}>
				<Stack screenOptions={{ headerShown: false }} />
				<FullscreenTakeover />
			</TeardownProvider>
		</>
	);
}
