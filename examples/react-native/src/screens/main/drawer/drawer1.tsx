import type { FunctionComponent } from "react";
import { Text, View } from "react-native";

type ScreenProps<Params = {}> = {
	from: string;
	params: Params;
};

type Screen<Params = {}> = FunctionComponent<ScreenProps<Params>>;

export const Screen: FunctionComponent = (props) => {
	return (
		<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
			<Text>Drawer 1</Text>
		</View>
	);
};
