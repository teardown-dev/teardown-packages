import { IdentityUser } from "@teardown/react-native/src/clients/identity";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { teardown } from "../lib/teardown";

export default function MainScreen() {



	const insets = useSafeAreaInsets();
	const [userId, setUserId] = useState<string>("");
	const [email, setEmail] = useState<string>("");
	const [name, setName] = useState<string>("");
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [user, setUser] = useState<IdentityUser | null>(null);

	const onIdentifyUser = async () => {
		try {

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
		}
	};

	const onIdentifyDevice = async () => {
		// const identityDevice = await teardown.identity.identifyDevice();
		// setIdentityDevice(identityDevice);
	};

	return (
		<View
			style={[
				{ paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right },
			]}
			className="flex-1 h-full justify-center items-center bg-[black] relative"
		>
			<View
				className="flex-1 h-full justify-center items-center bg-[black] relative w-full p-4 gap-4"
			>
				<TextInput
					placeholder="Enter your user ID"
					className=" bg-white p-4 rounded-lg w-full"
					placeholderTextColorClassName="text-black"
					value={userId}
					onChangeText={setUserId}
				/>
				<TextInput
					placeholder="Enter your name"
					className=" bg-white p-4 rounded-lg w-full"
					placeholderTextColorClassName="text-black"
					value={name}
					onChangeText={setName}
				/>
				<TextInput
					placeholder="Enter your email"
					className=" bg-white p-4 rounded-lg w-full"
					placeholderTextColorClassName="text-black"
					keyboardType="email-address"
					autoCapitalize="none"
					autoComplete="email"
					autoCorrect={false}
					value={email}
					onChangeText={setEmail}
				/>

				<View className="flex-1 flex-row p-4 gap-4 relative">
					<Button onPress={onIdentifyUser}>
						<Text className="text-[white]">Identify User</Text>
					</Button>
				</View>

				<View className="flex-1 p-4 gap-4 relative">
					<Text className="text-[white]">Session ID: {user?.session_id ?? "No user"}</Text>
					<Text className="text-[white]">Device ID: {user?.device_id ?? "No device"}</Text>
					<Text className="text-[white]">Persona ID: {user?.persona_id ?? "No persona"}</Text>
					<Text className="text-[white]">Token: {`${user?.token?.slice(0, 10)}...` ?? "No token"}</Text>
				</View>
			</View>
		</View>
	);
}

function Button({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
	return (
		<Pressable
			className="flex-1 max-h-20 justify-center items-center p-2.5 rounded-lg border border-[white]"
			onPress={onPress}
		>
			{children}
		</Pressable>
	);
}
