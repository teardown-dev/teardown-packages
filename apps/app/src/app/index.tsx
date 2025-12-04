import { useForceUpdate } from "@teardown/react-native";
import { StyleSheet, Text, View } from "react-native";

export default function MainScreen() {

	const forceUpdate = useForceUpdate();

	return (
		<View style={styles.container}>

			<View style={styles.infoContainer}>
				<Text style={styles.infoText}>
					Version status: {forceUpdate.versionStatus.type ?? "Unknown"}
				</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFFFFF",
		padding: 16,
		alignItems: "center",
		justifyContent: "center",
	},
	infoContainer: {
		width: "100%",
		padding: 16,
		gap: 12,
	},
	infoText: {
		color: "#1A1A1A",
		fontSize: 16,
		lineHeight: 24,
	},
});
