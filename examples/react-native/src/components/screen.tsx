import type { FunctionComponent, PropsWithChildren } from "react";
import React from "react";
import { View } from "react-native";

export type ScreenProps = PropsWithChildren<{}>;

export const Screen: FunctionComponent<ScreenProps> = (props) => {
	const {} = props;
	return <View />;
};
