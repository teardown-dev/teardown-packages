/** biome-ignore-all lint/complexity/noUselessFragments: allow for now */
import { TeardownProvider } from "@teardown/react-native";
import { Stack } from "expo-router";
import { FullscreenTakeover } from "../components/fullscreen-takeover";
import { teardown } from "../lib/teardown";
import "../styles/global.css";


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
