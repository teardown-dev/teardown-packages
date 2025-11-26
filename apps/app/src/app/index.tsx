import { Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { teardown } from "../lib/teardown";
import { useState } from "react";
import { IdentityUser } from "@teardown/react-native/src/clients/identity";

export default function MainScreen() {
	const insets = useSafeAreaInsets();


	const [user, setUser] = useState<IdentityUser | null>(null);

	const onIdentifyUser = async () => {
		try {

			const result = await teardown.identity.identify({
				email: "test@test.com",
				name: "Test",
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

			<TextInput placeholder="Enter your name" className="text-[white]" />

			<View className="flex-1 flex-row p-4 gap-4 relative">
				<Button onPress={onIdentifyUser}>
					<Text className="text-[white]">Identify User</Text>
				</Button>
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
