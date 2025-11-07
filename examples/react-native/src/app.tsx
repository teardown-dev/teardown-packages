import type React from "react";
import { useEffect } from "react";
import { Text, View } from "react-native";
import {
	GestureHandlerRootView,
	Pressable,
} from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

function App(): React.JSX.Element {
	console.log("App mounted");

	useEffect(() => {
		const intervalId = setInterval(() => {
			console.log("App interval");
		}, 2500);

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
						backgroundColor: "green",
						justifyContent: "center",
						alignItems: "center",
					}}
				>
					<Text>Hello</Text>

					<Pressable
						onPress={() => {
							throw new Error("Test error");
						}}
						style={{ backgroundColor: "red", padding: 8 }}
					>
						<Text>Press me</Text>
					</Pressable>
				</View>
			</GestureHandlerRootView>
		</SafeAreaProvider>
	);
}

export default App;

// declare module "@teardown/react-native-navigation" {
// 	interface Register {
// 		router: typeof router;
// 	}
// }

// type TeardownRouterProps = {
// 	router: Router<any>;
// };

// function TeardownRouter(props: TeardownRouterProps) {
// 	const RootStack = props.router.root.stack;
// 	const RootStackLayout = props.router.root.layout ?? Fragment;

// 	return (
// 		<View style={styles.root}>
// 			<RootStackLayout>
// 				<RootStack.Navigator>
// 					{Object.keys(props.router.screens).map((screenName) => {
// 						const screen = props.router.screens[screenName];
// 						return (
// 							<RootStack.Screen
// 								key={screen.name}
// 								name={screen.name}
// 								component={screen.component}
// 							/>
// 						);
// 					})}
// 				</RootStack.Navigator>
// 			</RootStackLayout>
// 		</View>
// 	);
// }

// const styles = StyleSheet.create({
// 	root: {
// 		flex: 1,
// 	},
// });
