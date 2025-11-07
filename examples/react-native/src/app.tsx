import type React from "react";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import {
	GestureHandlerRootView,
	Pressable,
} from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

function App(): React.JSX.Element {
	const [isOnline, setIsOnline] = useState<boolean | null>(null);
	const [lastChecked, setLastChecked] = useState<string>("");

	useEffect(() => {
		const checkConnectivity = async () => {
			try {
				const start = Date.now();
				const response = await fetch("https://8.8.8.8", {
					mode: "no-cors",
					cache: "no-cache",
				});
				const pingTime = Date.now() - start;
				setIsOnline(true);
				setLastChecked(`Online (ping: ${pingTime}ms)`);
			} catch (error) {
				setIsOnline(false);
				setLastChecked("Offline");
			}
		};

		// Initial check
		checkConnectivity();

		// Set up interval for periodic checks
		const intervalId = setInterval(checkConnectivity, 15000);

		return () => {
			clearInterval(intervalId);
		};
	}, []);

	return (
		<SafeAreaProvider style={{ flex: 1 }}>
			<GestureHandlerRootView style={{ flex: 1, backgroundColor: "pink" }}>
				<View
					style={{
						flex: 1,
						backgroundColor: "white",
						justifyContent: "center",
						alignItems: "center",
						gap: 20,
					}}
				>
					<Text style={{ fontSize: 24 }}>
						Connection Status: {isOnline === null ? "Checking..." : lastChecked}
					</Text>

					<Pressable
						onPress={() => {
							setIsOnline(null);
							setLastChecked("Checking...");
						}}
						style={({ pressed }) => ({
							backgroundColor: pressed ? "#0056b3" : "#007bff",
							padding: 12,
							borderRadius: 8,
						})}
					>
						<Text style={{ color: "white" }}>Check Now</Text>
					</Pressable>

					<Pressable
						onPress={() => {
							throw new Error("Test error");
						}}
						style={({ pressed }) => ({
							backgroundColor: pressed ? "#0056b3" : "#007bff",
							padding: 12,
							borderRadius: 8,
						})}
					>
						<Text style={{ color: "white" }}>Throw error</Text>
					</Pressable>
				</View>
			</GestureHandlerRootView>
		</SafeAreaProvider>
	);
}

export default App;
