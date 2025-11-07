import { NavigationContainer as ReactNavigationContainer } from "@react-navigation/native";
import { TeardownContainer } from "@teardown/react-native";
import type { Router } from "@teardown/react-native-navigation";
import { NavigationContainer } from "@teardown/react-native-navigation";
import type React from "react";
import { Fragment, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import teardownClient from "../teardown.client.ts";
import { router } from "./screens.gen.tsx";

function App(): React.JSX.Element {
	teardownClient.logger.log("App started");

	useEffect(() => {
		teardownClient.logger.log("App mounted");

		return () => {
			teardownClient.logger.log("App unmounted");
			teardownClient.shutdown();
		};
	}, []);

	return (
		<SafeAreaProvider style={{ flex: 1 }}>
			<GestureHandlerRootView style={{ flex: 1, backgroundColor: "pink" }}>
				<TeardownContainer client={teardownClient}>
					<ReactNavigationContainer>
						<NavigationContainer>
							<TeardownRouter router={router} />
						</NavigationContainer>
					</ReactNavigationContainer>
				</TeardownContainer>
			</GestureHandlerRootView>
		</SafeAreaProvider>
	);
}

export default App;

declare module "@teardown/react-native-navigation" {
	interface Register {
		router: typeof router;
	}
}

type TeardownRouterProps = {
	router: Router<any>;
};

function TeardownRouter(props: TeardownRouterProps) {
	const RootStack = props.router.root.stack;
	const RootStackLayout = props.router.root.layout ?? Fragment;

	return (
		<View style={styles.root}>
			<RootStackLayout>
				<RootStack.Navigator>
					{Object.keys(props.router.screens).map((screenName) => {
						const screen = props.router.screens[screenName];
						return (
							<RootStack.Screen
								key={screen.name}
								name={screen.name}
								component={screen.component}
							/>
						);
					})}
				</RootStack.Navigator>
			</RootStackLayout>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
});
