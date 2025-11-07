import type { FunctionComponent, PropsWithChildren } from "react";
import React from "react";
import type { PluginTuple, TeardownClient } from "../teardown.client";
import type { DebuggerUiOptions } from "../components";
import { TeardownService } from "../services";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export type TeardownContainerOptions = {
	debugger: DebuggerUiOptions;
};

export type TeardownContainerProps<T extends readonly PluginTuple[]> =
	PropsWithChildren<{
		client: TeardownClient<T>;
		options?: TeardownContainerOptions;
	}>;

export const TeardownContainer: FunctionComponent<
	TeardownContainerProps<any>
> = (props) => {
	const { children, client, options } = props;

	const providedState = TeardownService.useProvidedState(client);

	return (
		<SafeAreaProvider>
			<GestureHandlerRootView>
				{/* <BottomSheetModalProvider> TODO: Move this into a theme provider/package */}
				{/*      <TeardownService.Provider value={providedState}>*/}
				{children}
				{/*        <DebuggerUi {...options?.debugger} />*/}
				{/*      </TeardownService.Provider>*/}
				{/* </BottomSheetModalProvider> */}
			</GestureHandlerRootView>
		</SafeAreaProvider>
	);
};
