// import './src/modules/theme/globals.css';

import React from 'react';
import {SafeAreaView, View} from 'react-native';
import './modules/theme/globals.css';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';

export const App = () => {
  return (
    <SafeAreaProvider className={'flex-1'}>
      <GestureHandlerRootView className={'flex-1 bg-[orange]'}>
        <View className={'flex-1'} />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
};
