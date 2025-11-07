import type { FunctionComponent, PropsWithChildren } from "react";
import { StyleSheet } from "react-native";
import { NavigationService } from "../services";

export type NavigationContainerProps = PropsWithChildren<{}>;

export const NavigationContainer: FunctionComponent<
	NavigationContainerProps
> = (props) => {
	const { children } = props;

	const providedState = NavigationService.useProvidedState();

	return (
		<NavigationService.Provider value={providedState}>
			{children}
		</NavigationService.Provider>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
});
