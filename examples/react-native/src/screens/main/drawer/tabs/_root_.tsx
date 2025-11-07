import {
	type BottomTabNavigationOptions,
	createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import { createStack } from "@teardown/react-native-navigation";

export const Stack = createStack<BottomTabNavigationOptions>({
	name: "main",
	stack: createBottomTabNavigator(),
	options: {
		headerShown: false,
	},
});
