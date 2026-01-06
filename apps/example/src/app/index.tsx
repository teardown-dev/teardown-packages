import { useForceUpdate, useSession } from "@teardown/react-native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { NotificationLog } from "../components/notification-log";
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
		<ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Session Info</Text>
				<View style={styles.infoContainer}>
					<Text style={styles.infoText}>Session: {session?.session_id ?? "Unknown"} </Text>
					<Text style={styles.infoText}>Device ID: {session?.device_id ?? "Unknown"} </Text>
					<Text style={styles.infoText}>Persona ID: {session?.user_id ?? "Unknown"} </Text>
					<Text style={styles.infoText}>Version status: {forceUpdate.versionStatus.type ?? "Unknown"}</Text>
					<Text style={styles.infoText}>Environment: {teardown.api.environmentSlug}</Text>
					<Text style={styles.infoText}>API: {teardown.api.ingestUrl}</Text>
				</View>

				<TextInput style={styles.input} placeholder="User ID" value={userId} onChangeText={onUserIdTextChange} />
				<TextInput style={styles.input} placeholder="Email" value={email} onChangeText={onIdentifyTextChange} />
				<TextInput style={styles.input} placeholder="Name" value={name} onChangeText={onNameTextChange} />

				<Pressable style={styles.button} onPress={onIdentify}>
					<Text style={styles.buttonText}>Identify</Text>
				</Pressable>
			</View>

			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Push Notifications</Text>
				<NotificationLog />
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	scrollContainer: {
		flex: 1,
		backgroundColor: "#FFFFFF",
	},
	scrollContent: {
		padding: 16,
		paddingTop: 60,
	},
	section: {
		marginBottom: 32,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "#1A1A1A",
		marginBottom: 12,
	},
	infoContainer: {
		width: "100%",
		padding: 16,
		gap: 12,
		backgroundColor: "#F5F5F5",
		marginBottom: 16,
	},
	infoText: {
		color: "#1A1A1A",
		fontSize: 14,
		lineHeight: 20,
	},
	input: {
		width: "100%",
		height: 40,
		borderColor: "#1A1A1A",
		borderWidth: 1,
		padding: 8,
		marginBottom: 12,
	},
	button: {
		width: "100%",
		height: 40,
		backgroundColor: "#1A1A1A",
		alignItems: "center",
		justifyContent: "center",
	},
	buttonText: {
		color: "#FFFFFF",
		fontSize: 16,
		lineHeight: 24,
	},
});
