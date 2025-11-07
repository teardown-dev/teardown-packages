import {
	type NativeStackNavigationOptions,
	createNativeStackNavigator,
} from "@react-navigation/native-stack";
import { createStack } from "@teardown/react-native-navigation";

export const Stack = createStack<NativeStackNavigationOptions>({
	name: "main",
	stack: createNativeStackNavigator(),
	options: {
		tabBarShown: false,
	},
});
