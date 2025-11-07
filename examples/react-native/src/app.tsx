import type React from "react";
import { NativeModules, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

function App(): React.JSX.Element {
	console.log("App mounted");

	return (
		<SafeAreaProvider style={{ flex: 1 }}>
			<GestureHandlerRootView style={{ flex: 1, backgroundColor: "pink" }}>
				<View
					style={{
						flex: 1,
						backgroundColor: "red",
						justifyContent: "center",
						alignItems: "center",
					}}
				>
					<Text>Helllo</Text>
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
