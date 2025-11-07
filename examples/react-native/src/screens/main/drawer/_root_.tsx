import {
	type BottomTabNavigationOptions,
	createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createStack } from "@teardown/react-native-navigation";

export const Stack = createStack<BottomTabNavigationOptions>({
	name: "bottom-tabs",
	stack: createNativeStackNavigator(),
	options: {
		headerShown: false,
	},
});
