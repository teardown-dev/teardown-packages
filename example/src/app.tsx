import './reactotron-config.ts';
import './theme';
import 'react-native-url-polyfill/auto';
import 'react-native-reanimated';
import 'react-native-gesture-handler';
import type {FunctionComponent} from 'react';
import React from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import {Main} from './main';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from './modules/queries/query.client.ts';
import {MapboxContainer} from './modules/mapbox/containers/mapbox.container.tsx';

export const App: FunctionComponent = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <MapboxContainer>
        <Visual />
      </MapboxContainer>
    </QueryClientProvider>
  );
};

const Visual: FunctionComponent = () => {
  return (
    <GestureHandlerRootView className={'flex-1 bg-white'}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <NavigationContainer>
            <Main />
          </NavigationContainer>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};
