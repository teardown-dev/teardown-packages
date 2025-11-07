import type {FunctionComponent, PropsWithChildren} from 'react';
import React from 'react';
import {Text} from '../../../components/text';
import {View} from 'react-native';
import {BottomSheet} from "../../../components/bottom-sheet.tsx";

export type MapScreenProps = PropsWithChildren<{}>;

export const HomeScreen: FunctionComponent<MapScreenProps> = props => {
  const {} = props;
  return (
    <View className={'flex-1'}>
      <BottomSheet>
        <View className={"h-96"}>
            <Text>Bottom Sheet Content</Text>
        </View>
      </BottomSheet>
    </View>
  );
};
