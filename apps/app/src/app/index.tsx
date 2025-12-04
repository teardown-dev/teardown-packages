import type { IdentityUser } from "@teardown/react-native/src/clients/identity";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { global_storage, teardown } from "../lib/teardown";
import { useForceUpdate, useSession, useValidSession } from "@teardown/react-native";



export default function MainScreen() {
	const insets = useSafeAreaInsets();
	const [userId, setUserId] = useState<string>("");
	const [email, setEmail] = useState<string>("");
	const [name, setName] = useState<string>("");
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [user, setUser] = useState<IdentityUser | null>(null);
	const [identifyOnLoad, setIdentifyOnLoad] = useState<boolean>(() => {
		try {
			return global_storage.getBoolean("identify_on_load") ?? false;
		} catch {
			return false;
		}
	});

	const onIdentifyUser = async () => {
		try {
			setIsLoading(true);
			const result = await teardown.identity.identify({
				email,
				name,
			});

			if (result.success) {
				console.log("User identified", result);
				setUser(result.data);
			} else {
				console.error("Error identifying user 111", result.error);
			}
		} catch (error) {
			console.error("Error identifying user 222", error);
		} finally {
			setIsLoading(false);
		}
	};

	const onValueChangeIdentifyOnLoad = (value: boolean) => {
		setIdentifyOnLoad(value);
		global_storage.set("identify_on_load", value);
	};

	const versionStatus = useForceUpdate();
	const validSession = useValidSession();

	return (
		<View
			style={[
				styles.container,
				{ paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right },
			]}
		>
			<View style={styles.content}>
				<View style={styles.infoContainer}>
					<Text style={styles.infoText}>Version status: {versionStatus.versionStatus.type ?? "Unknown"}</Text>
					<Text style={styles.infoText}>Device ID: {validSession?.session.device_id ?? "No device ID"}</Text>
					<Text style={styles.infoText}>Persona ID: {validSession?.session.persona_id ?? "No persona ID"}</Text>
					<Text style={styles.infoText}>Token: {`${validSession?.session.token?.slice(0, 10)}...` ?? "No token"}</Text>
				</View>
				<View style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}>
					<Switch
						value={identifyOnLoad}
						onValueChange={onValueChangeIdentifyOnLoad}
					/>
					<Text style={{ fontSize: 16, color: "#1A1A1A", marginLeft: 8 }}>Identify on load</Text>
				</View>
				<TextInput
					placeholder="Enter your user ID"
					style={styles.input}
					placeholderTextColor="#666666"
					value={userId}
					onChangeText={setUserId}
				/>
				<TextInput
					placeholder="Enter your name"
					style={styles.input}
					placeholderTextColor="#666666"
					value={name}
					onChangeText={setName}
				/>
				<TextInput
					placeholder="Enter your email"
					style={styles.input}
					placeholderTextColor="#666666"
					keyboardType="email-address"
					autoCapitalize="none"
					autoComplete="email"
					autoCorrect={false}
					value={email}
					onChangeText={setEmail}
				/>

				<View style={styles.buttonContainer}>
					<Button onPress={onIdentifyUser}>
						<Text style={styles.buttonText}>{isLoading ? "Identifying..." : "Identify User"}</Text>
					</Button>
				</View>




			</View>
		</View>
	);
}

function Button({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
	return (
		<Pressable
			style={styles.primaryButton}
			onPress={onPress}
		>
			{children}
		</Pressable>
	);
}

function Switch({ value, onValueChange }: { value: boolean; onValueChange: (value: boolean) => void }) {
	return (
		<Pressable
			onPress={() => onValueChange(!value)}
			style={({ pressed }) => [
				styles.switchTrack,
				value && styles.switchTrackActive,
				pressed && styles.switchTrackPressed,
			]}
		>
			<View style={[styles.switchThumb, value && styles.switchThumbActive]} />
		</Pressable>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFFFFF",
	},
	content: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		width: "100%",
		padding: 24,
		gap: 16,
	},
	input: {
		backgroundColor: "#FFFFFF",
		padding: 16,
		borderRadius: 12,
		width: "100%",
		borderWidth: 1,
		borderColor: "#E5E5E5",
		fontSize: 16,
		color: "#1A1A1A",
	},
	buttonContainer: {
		width: "100%",
		marginTop: 8,
	},
	primaryButton: {
		backgroundColor: "#2C2C2C",
		paddingHorizontal: 32,
		paddingVertical: 16,
		borderRadius: 12,
		width: "100%",
		alignItems: "center",
		justifyContent: "center",
	},
	buttonText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "600",
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
	switchTrack: {
		width: 51,
		height: 31,
		borderRadius: 15.5,
		backgroundColor: "#CCC",
		justifyContent: "center",
		padding: 2,
	},
	switchTrackActive: {
		backgroundColor: "#007AFF",
	},
	switchTrackPressed: {
		opacity: 0.8,
	},
	switchThumb: {
		width: 27,
		height: 27,
		borderRadius: 13.5,
		backgroundColor: "#FFFFFF",
		alignSelf: "flex-start",
	},
	switchThumbActive: {
		alignSelf: "flex-end",
	},
});
