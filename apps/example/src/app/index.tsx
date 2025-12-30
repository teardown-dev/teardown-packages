import { useForceUpdate, useSession } from "@teardown/react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { teardown } from "../lib/teardown";

export default function MainScreen() {
	const forceUpdate = useForceUpdate();
	const session = useSession();

	const [userId, setUserId] = useState("");
	const [email, setEmail] = useState("");
	const [name, setName] = useState("");

	const onIdentifyTextChange = (text: string) => {
		setEmail(text);
	};

	const onNameTextChange = (text: string) => {
		setName(text);
	};

	const onUserIdTextChange = (text: string) => {
		setUserId(text);
	};

	const onIdentify = () => {
		teardown.identity
			.identify({
				email: email,
				name: name,
				user_id: userId,
			})
			.then((result) => {
				console.log("Identify result", result);
			});
	};

	return (
		<View style={styles.container}>
			<View style={styles.infoContainer}>
				<Text style={styles.infoText}>Session: {session?.session_id ?? "Unknown"} </Text>
				<Text style={styles.infoText}>Device ID: {session?.device_id ?? "Unknown"} </Text>
				<Text style={styles.infoText}>Persona ID: {session?.user_id ?? "Unknown"} </Text>
				<Text style={styles.infoText}>Version status: {forceUpdate.versionStatus.type ?? "Unknown"}</Text>
			</View>

			<TextInput style={styles.input} placeholder="User ID" value={userId} onChangeText={onUserIdTextChange} />
			<TextInput style={styles.input} placeholder="Email" value={email} onChangeText={onIdentifyTextChange} />
			<TextInput style={styles.input} placeholder="Name" value={name} onChangeText={onNameTextChange} />

			<Pressable style={styles.button} onPress={onIdentify}>
				<Text style={styles.buttonText}>Identify</Text>
			</Pressable>
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
	input: {
		width: "100%",
		height: 40,
		borderColor: "#1A1A1A",
		borderWidth: 1,
		padding: 8,
		marginBottom: 16,
	},
	button: {
		width: "100%",
		height: 40,
		backgroundColor: "#1A1A1A",
		fontSize: 16,
		lineHeight: 24,
		alignItems: "center",
		justifyContent: "center",
	},
	buttonText: {
		color: "#FFFFFF",
		fontSize: 16,
		lineHeight: 24,
	},
});
