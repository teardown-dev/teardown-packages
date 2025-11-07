import type { FunctionComponent, PropsWithChildren } from "react";
import React from "react";
import { View } from "react-native";

export type OutletProps = PropsWithChildren<{}>;

export const Outlet: FunctionComponent<OutletProps> = (props) => {
	const {} = props;

	// get the context and render the children screens here

	return <View />;
};
