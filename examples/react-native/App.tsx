/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import type React from "react";
import type { PropsWithChildren } from "react";
import {
	SafeAreaView,
	ScrollView,
	StatusBar,
	StyleSheet,
	Text,
	useColorScheme,
	View,
} from "react-native";

import {
	Colors,
	DebugInstructions,
	Header,
	LearnMoreLinks,
	ReloadInstructions,
} from "react-native/Libraries/NewAppScreen";
import { TeardownContainer } from "@teardown/react-native";

function App(): React.JSX.Element {
	return (
		<TeardownContainer client={null}>
			<></>
		</TeardownContainer>
	);
}

export default App;
