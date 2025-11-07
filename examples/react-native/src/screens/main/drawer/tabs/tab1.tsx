import { DrawerActions, useNavigation } from "@react-navigation/native";
import type { FunctionComponent } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type ScreenProps<Params = {}> = {
	from: string;
	params: Params;
};

type Screen<Params = {}> = FunctionComponent<ScreenProps<Params>>;

export const Screen: FunctionComponent = (props) => {
	const navigation = useNavigation();

	const navigateToTables = () => {
		navigation.dispatch(DrawerActions.openDrawer());
	};

	return (
		<View style={styles.root}>
			<Text>Tab 1</Text>
			<TouchableOpacity style={styles.button} onPress={navigateToTables}>
				<Text style={styles.buttonText}>Navigate to Drawer</Text>
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
