import type { FunctionComponent, PropsWithChildren } from "react";
import React from "react";
import { Text, View } from "react-native";

export type StackProps = PropsWithChildren<{}>;

export const StackScreen: FunctionComponent<{ params: {} }> = (props) => {
	const { params } = props;
	return (
		<View>
			<Text>Stack</Text>
		</View>
	);
};
