import {FunctionComponent, PropsWithChildren} from "react";
import {TeardownService} from "../services";
import {TeardownClient} from "../teardown.client";
import {DebuggerUi, DebuggerUiOptions} from "../components";
import {SafeAreaProvider} from "react-native-safe-area-context";

export type TeardownContainerOptions = {
    debugger: DebuggerUiOptions;
}

export type TeardownContainerProps = PropsWithChildren<{
    client: TeardownClient;
    options?: TeardownContainerOptions;
}>;

export const TeardownContainer: FunctionComponent<TeardownContainerProps> = (props) => {
    const {children, client, options} = props;

    const providedState = TeardownService.useProvidedState(client);

    return (
        <SafeAreaProvider>
            <TeardownService.Provider value={providedState}>
                {children}
                <DebuggerUi {...options?.debugger} />
            </TeardownService.Provider>
        </SafeAreaProvider>
    );
};
