import React from 'react';
// import './modules/theme/globals.css';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {Main} from './main.tsx';
import {SpacexContainer} from './modules/spacex/containers/spacex.container.tsx';
import {teardownClient} from './modules/teardown/teardown.client.ts';

const client = new QueryClient();

console.log('teardownClient', teardownClient);

export const App = () => {
  return (
    <>
      <SafeAreaProvider className={'flex-1'}>
        <GestureHandlerRootView className={'flex-1 bg-[orange]'}>
          <QueryClientProvider client={client}>
            <SpacexContainer>
              <Main />
            </SpacexContainer>
          </QueryClientProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </>
  );
};
