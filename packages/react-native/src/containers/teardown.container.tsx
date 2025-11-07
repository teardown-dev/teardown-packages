import {FunctionComponent, PropsWithChildren} from 'react';
import {PluginTuple, TeardownClient} from '../teardown.client';
import {DebuggerUiOptions} from '../components/debugger-ui';
import {SafeAreaProvider} from 'react-native-safe-area-context';

export type TeardownContainerOptions = {
  debugger: DebuggerUiOptions;
};

export type TeardownContainerProps<T extends readonly PluginTuple[]> = PropsWithChildren<{
  client: TeardownClient<T>;
  options?: TeardownContainerOptions;
}>;

export const TeardownContainer: FunctionComponent<
  TeardownContainerProps<any>
> = props => {
  const {children, client, options} = props;

  // const providedState = TeardownService.useProvidedState(client);

  return (
    <>
      {children}
    </>
  );

  return (
      <SafeAreaProvider className={"flex-1 bg-white"}>
    {/*<GestureHandlerRootView>*/}
    {/*    <BottomSheetModalProvider> /!* TODO: Move this into a theme provider/package *!/*/}
    {/*      <TeardownService.Provider value={providedState}>*/}
    {/*        {children}*/}
    {/*        <DebuggerUi {...options?.debugger} />*/}
    {/*      </TeardownService.Provider>*/}
    {/*    </BottomSheetModalProvider>*/}
    {/*</GestureHandlerRootView>*/}
      </SafeAreaProvider>
  );
};
