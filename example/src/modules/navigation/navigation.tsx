import type {FunctionComponent, PropsWithChildren} from 'react';
import React from 'react';
import {View} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {HomeScreen} from '../home/screens/home.screen';

export type NavigationProps = PropsWithChildren<{}>;

export type NavigationStackParamList = {
  Home: undefined;
};

export const NavigationStack =
  createNativeStackNavigator<NavigationStackParamList>();

export const Navigation: FunctionComponent<NavigationProps> = props => {
  const {} = props;
  return (
    <View className={'flex-1 bg-white'}>
      <NavigationStack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          // contentStyle: {
          //   backgroundColor: 'transparent',
          //   pointerEvents: 'box-none',
          // },
        }}>
        <NavigationStack.Screen name="Home" component={HomeScreen} />
      </NavigationStack.Navigator>
    </View>
  );
};
