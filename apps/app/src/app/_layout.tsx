import { TeardownProvider } from "@teardown/react-native";
import { Stack } from "expo-router";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { teardown } from "../lib/teardown";

export default function RootLayout() {
	return (
		<SafeAreaProvider>
			<TeardownProvider core={teardown}>
				<Stack screenOptions={{ headerShown: false }} />
			</TeardownProvider>
		</SafeAreaProvider>
	);
}
