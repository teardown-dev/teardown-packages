import React from "react";
import { Stack } from "expo-router";
import { TeardownProvider } from "@teardown/react-native";
import { teardown } from "../lib/teardown";

export default function RootLayout() {
	return (
		<TeardownProvider core={teardown}>
			<Stack />
		</TeardownProvider>
	);
}
