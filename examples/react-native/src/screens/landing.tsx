import { useNavigation } from "@react-navigation/native";
import type { FunctionComponent } from "react";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";

export type LandingProps = {
	params: {};
};

export const Screen: FunctionComponent<LandingProps> = (props) => {
	const {} = props;

	const navigation = useNavigation();
	const navigateToTables = () => {
		navigation.navigate("main");
	};

	return (
		<View style={styles.root}>
			<Text>Welcome to Teardown Navigation for React Native</Text>
			<Text>
				This app is an example of what you can do with file based routing system
				that is also typesafe for React Native.
			</Text>
			<Text>
				Teardown Navigation is a routing system that is based on file structure
				and is primarily for mobile apps. And currently only support React
				Native for iOS and Android.
			</Text>

			<TouchableOpacity style={styles.button} onPress={navigateToTables}>
				<Text style={styles.buttonText}>Open Main</Text>
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		flexDirection: "column",
		gap: 16,
		padding: 16,
	},
	button: {
		backgroundColor: "blue",
		paddingHorizontal: 20,
		paddingVertical: 16,
		maxWidth: 200,
		borderRadius: 8,
	},
	buttonText: {
		color: "white",
		textAlign: "center",
	},
});
