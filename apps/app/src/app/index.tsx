import { StyleSheet, Text, View } from "react-native";

export default function MainScreen() {
	return (
		<View style={styles.container}>


			<Text>Persona ID: { }</Text>

		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
});
