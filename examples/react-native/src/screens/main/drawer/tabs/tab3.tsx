import type { FunctionComponent } from "react";
import { Text, View } from "react-native";

export type TableGroupsProps = {};
export type ScreenProps = {};

export const Screen: FunctionComponent<ScreenProps> = (props) => {
	const {} = props;
	return (
		<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
			<Text>Tab 3</Text>
		</View>
	);
};
