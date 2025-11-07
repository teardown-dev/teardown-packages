import type { FunctionComponent, PropsWithChildren } from "react";
import type { PluginTuple, TeardownClient } from "../teardown.client";
import type { DebuggerUiOptions } from "../components";
import { SafeAreaProvider } from "react-native-safe-area-context";
import React from "react";

export type TeardownContainerOptions = {
	debugger: DebuggerUiOptions;
};

export type TeardownContainerProps<T extends readonly PluginTuple[]> =
	PropsWithChildren<{
		client: TeardownClient<T>;
		options?: TeardownContainerOptions;
	}>;

export const TeardownContainer: FunctionComponent<
	// biome-ignore lint/suspicious/noExplicitAny: We allow any here because the client can have any plugins injected
	TeardownContainerProps<any>
> = (props) => {
	const { children, client, options } = props;

	// const providedState = TeardownService.useProvidedState(client);

	return <>{children}</>;

	// return (
	// 	<SafeAreaProvider className={"flex-1 bg-white"}>
	// 		{/*<GestureHandlerRootView>*/}
	// 		{/*    <BottomSheetModalProvider> /!* TODO: Move this into a theme provider/package *!/*/}
	// 		{/*      <TeardownService.Provider value={providedState}>*/}
	// 		{/*        {children}*/}
	// 		{/*        <DebuggerUi {...options?.debugger} />*/}
	// 		{/*      </TeardownService.Provider>*/}
	// 		{/*    </BottomSheetModalProvider>*/}
	// 		{/*</GestureHandlerRootView>*/}
	// 	</SafeAreaProvider>
	// );
};
