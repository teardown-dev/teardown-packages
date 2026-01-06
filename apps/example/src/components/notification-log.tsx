import * as Device from "expo-device";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { teardown } from "../lib/teardown";

interface NotificationLogEntry {
	id: string;
	timestamp: Date;
	type: "notification" | "data_message";
	title?: string;
	body?: string;
	data?: Record<string, unknown>;
}

export function NotificationLog() {
	const [entries, setEntries] = useState<NotificationLogEntry[]>([]);
	const [permissionStatus, setPermissionStatus] = useState<string>("unknown");

	useEffect(() => {
		if (!teardown.notifications) {
			return;
		}

		const notificationUnsub = teardown.notifications.onNotificationReceived((notification) => {
			setEntries((prev) => [
				{
					id: `notif-${Date.now()}`,
					timestamp: new Date(),
					type: "notification",
					title: notification.title,
					body: notification.body,
					data: notification.data,
				},
				...prev,
			]);
		});

		const dataMessageUnsub = teardown.notifications.onDataMessage((message) => {
			setEntries((prev) => [
				{
					id: `data-${Date.now()}`,
					timestamp: new Date(),
					type: "data_message",
					data: message.data,
				},
				...prev,
			]);
		});

		return () => {
			notificationUnsub();
			dataMessageUnsub();
		};
	}, []);

	const requestPermissions = async () => {
		if (!teardown.notifications) {
			return;
		}

		const status = await teardown.notifications.requestPermissions();
		setPermissionStatus(status.granted ? "granted" : "denied");

		if (status.granted) {
			const token = await teardown.notifications.getToken();
			if (token) {
				setEntries((prev) => [
					{
						id: `token-${Date.now()}`,
						timestamp: new Date(),
						type: "notification",
						title: "Push Token Retrieved",
						body: token.slice(0, 50) + "...",
						data: { token },
					},
					...prev,
				]);
			}
		}
	};

	const clearLog = () => {
		setEntries([]);
	};

	const renderEntry = ({ item }: { item: NotificationLogEntry }) => (
		<View style={styles.entry}>
			<View style={styles.entryHeader}>
				<Text style={styles.entryType}>{item.type === "data_message" ? "DATA" : "NOTIF"}</Text>
				<Text style={styles.entryTime}>{item.timestamp.toLocaleTimeString()}</Text>
			</View>
			{item.title ? <Text style={styles.entryTitle}>{item.title}</Text> : null}
			{item.body ? <Text style={styles.entryBody}>{item.body}</Text> : null}
			{item.data ? <Text style={styles.entryData}>{JSON.stringify(item.data, null, 2)}</Text> : null}
		</View>
	);

	if (!teardown.notifications) {
		return (
			<View style={styles.container}>
				<Text style={styles.noAdapter}>Notification adapter not configured</Text>
			</View>
		);
	}

	const isSimulator = !Device.isDevice;

	return (
		<View style={styles.container}>
			{isSimulator ? (
				<View style={styles.simulatorWarning}>
					<Text style={styles.simulatorWarningText}>⚠️ Push notifications do not work on simulators</Text>
				</View>
			) : null}

			<View style={styles.buttonRow}>
				<Pressable style={styles.button} onPress={requestPermissions}>
					<Text style={styles.buttonText}>Request Permissions</Text>
				</Pressable>
				<Pressable style={[styles.button, styles.clearButton]} onPress={clearLog}>
					<Text style={styles.buttonText}>Clear</Text>
				</Pressable>
			</View>

			<Text style={styles.status}>Permission: {permissionStatus}</Text>

			<FlatList
				data={entries}
				renderItem={renderEntry}
				keyExtractor={(item) => item.id}
				style={styles.list}
				ListEmptyComponent={<Text style={styles.emptyText}>No notifications received yet</Text>}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		width: "100%",
	},
	buttonRow: {
		flexDirection: "row",
		gap: 8,
		marginBottom: 8,
	},
	button: {
		flex: 1,
		height: 36,
		backgroundColor: "#1A1A1A",
		alignItems: "center",
		justifyContent: "center",
	},
	clearButton: {
		backgroundColor: "#666666",
		flex: 0,
		paddingHorizontal: 16,
	},
	buttonText: {
		color: "#FFFFFF",
		fontSize: 14,
	},
	status: {
		fontSize: 12,
		color: "#666666",
		marginBottom: 8,
	},
	list: {
		flex: 1,
	},
	entry: {
		backgroundColor: "#F5F5F5",
		padding: 12,
		marginBottom: 8,
		borderRadius: 4,
	},
	entryHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 4,
	},
	entryType: {
		fontSize: 10,
		fontWeight: "bold",
		color: "#1A1A1A",
		backgroundColor: "#E0E0E0",
		paddingHorizontal: 6,
		paddingVertical: 2,
	},
	entryTime: {
		fontSize: 10,
		color: "#666666",
	},
	entryTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: "#1A1A1A",
		marginTop: 4,
	},
	entryBody: {
		fontSize: 13,
		color: "#333333",
		marginTop: 2,
	},
	entryData: {
		fontSize: 11,
		color: "#666666",
		fontFamily: "monospace",
		marginTop: 4,
		backgroundColor: "#EEEEEE",
		padding: 8,
	},
	emptyText: {
		textAlign: "center",
		color: "#999999",
		fontSize: 14,
		marginTop: 20,
	},
	noAdapter: {
		textAlign: "center",
		color: "#999999",
		fontSize: 14,
	},
	simulatorWarning: {
		backgroundColor: "#FFF3CD",
		borderColor: "#FFECB5",
		borderWidth: 1,
		padding: 10,
		marginBottom: 12,
		borderRadius: 4,
	},
	simulatorWarningText: {
		color: "#856404",
		fontSize: 13,
		textAlign: "center",
	},
});
