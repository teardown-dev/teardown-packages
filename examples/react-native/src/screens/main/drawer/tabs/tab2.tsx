import type { FunctionComponent } from "react";
import { Text, View } from "react-native";

export type ScreenProps = {};

export const Screen: FunctionComponent<ScreenProps> = (props) => {
	const {} = props;
	return (
		<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
			<Text>Tab 2</Text>
		</View>
	);
};
