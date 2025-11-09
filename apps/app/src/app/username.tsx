import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MainScreen() {
	const insets = useSafeAreaInsets();
	const onIdentifyUser = async () => {
		// const identityUser = await teardown.identity.identify({
		// 	email: "test@test.com",
		// 	name: "Test",
		// });
		// setIdentityUser(identityUser);
	};

	const onIdentifyDevice = async () => {
		// const identityDevice = await teardown.identity.identifyDevice();
		// setIdentityDevice(identityDevice);
	};

	return (
		<View
			style={[
				styles.container,
				{ paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right },
			]}
		>
			<View style={styles.buttonsContainer}>
				<Button onPress={onIdentifyDevice}>
					<Text style={styles.text}>Identify Device</Text>
				</Button>
				<Button onPress={onIdentifyUser}>
					<Text style={styles.text}>Identify User</Text>
				</Button>
			</View>
		</View>
	);
}

function Button({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
	return (
		<Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={onPress}>
			{children}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "black",
		position: "relative",
	},
	buttonsContainer: {
		flex: 1,
		flexDirection: "row",
		padding: 16,
		gap: 16,
		position: "relative",
	},
	text: {
		color: "white",
	},
	button: {
		flex: 1,
		maxHeight: 100,
		justifyContent: "center",
		alignItems: "center",
		padding: 10,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: "white",
	},
	buttonPressed: {
		transform: [{ scale: 0.98 }],
	},
});
