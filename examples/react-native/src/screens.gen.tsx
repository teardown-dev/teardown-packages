import type React from "react";
import type { FunctionComponent } from "react";
import { Screen as landingScreen } from "./screens/landing.tsx";

import { Screen as drawer1Screen } from "./screens/main/drawer/drawer1.tsx";
import { Screen as drawer2Screen } from "./screens/main/drawer/drawer2.tsx";
import { Screen as drawer3Screen } from "./screens/main/drawer/drawer3.tsx";

import { createRouter } from "@teardown/react-native-navigation";
import { Screen as tab1Screen } from "./screens/main/drawer/tabs/tab1.tsx";
import { Screen as tab2Screen } from "./screens/main/drawer/tabs/tab2.tsx";
import { Screen as tab3Screen } from "./screens/main/drawer/tabs/tab3.tsx";

import { Stack as rootStack } from "./screens/_root_.tsx";
import { Stack as mainStack } from "./screens/main/_root_.tsx";
import { Stack as drawerStack } from "./screens/main/drawer/_root_.tsx";
import { Stack as tabsStack } from "./screens/main/drawer/tabs/_root_.tsx";

export const DrawerStack: FunctionComponent = (props) => {
	return (
		<drawerStack.stack.Navigator>
			<drawerStack.stack.Screen name={"drawer1"} component={drawer1Screen} />
			<drawerStack.stack.Screen name={"drawer2"} component={drawer2Screen} />
			<drawerStack.stack.Screen name={"drawer3"} component={drawer3Screen} />
		</drawerStack.stack.Navigator>
	);
};

export const TabsStack: FunctionComponent = (props) => {
	return (
		<tabsStack.stack.Navigator>
			<tabsStack.stack.Screen name={"tab1"} component={tab1Screen} />
			<tabsStack.stack.Screen name={"tab2"} component={tab2Screen} />
			<tabsStack.stack.Screen name={"tab3"} component={tab3Screen} />
		</tabsStack.stack.Navigator>
	);
};

export const MainStack: FunctionComponent = (props) => {
	return (
		<mainStack.stack.Navigator>
			<mainStack.stack.Screen name={"drawer"} component={DrawerStack} />
			<mainStack.stack.Screen name={"tabs"} component={TabsStack} />
		</mainStack.stack.Navigator>
	);
};

export const router = createRouter(rootStack, {
	landing: {
		type: "screen",
		name: "landing",
		component: landingScreen,
	},
	main: {
		type: "stack",
		name: "main",
		component: MainStack,
		screens: {
			drawer: {
				type: "stack",
				name: "drawer",
				component: DrawerStack,
				screens: {
					drawer1: {
						type: "screen",
						name: "drawer1",
						component: drawer1Screen,
					},
					drawer2: {
						type: "screen",
						name: "drawer2",
						component: drawer2Screen,
					},
					drawer3: {
						type: "screen",
						name: "drawer3",
						component: drawer3Screen,
					},
				},
			},
			tabs: {
				type: "stack",
				name: "tabs",
				component: TabsStack,
				screens: {
					tab1: {
						type: "screen",
						name: "tab1",
						component: tab1Screen,
					},
					tab2: {
						type: "screen",
						name: "tab2",
						component: tab2Screen,
					},
					tab3: {
						type: "screen",
						name: "tab3",
						component: tab3Screen,
					},
				},
			},
		},
	},
} as const) as const;

export type RouterType = typeof router;

type asd = RouterType["screens"];

declare module "@teardown/react-native-navigation" {
	interface ScreenPaths {}
}
