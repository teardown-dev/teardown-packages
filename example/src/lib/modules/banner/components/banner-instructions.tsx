import type {FunctionComponent, PropsWithChildren} from 'react';
import React from 'react';
import {Text, View} from 'react-native';
import {useBannerState} from '../hooks';
// import {useManeuver} from '../../maneuver/hooks/use-maneuver.ts';

export type BannerInstructionsProps = PropsWithChildren<{}>;

export const BannerInstructions: FunctionComponent<
  BannerInstructionsProps
> = props => {
  const bannerState = useBannerState();
  // const maneuver = useManeuver();

  if (bannerState == null) {
    return null;
  }

  return (
    <>
      <View className={'flex-row items-start bg-white p-4 rounded-lg'}>
        <View className={'w-12 h-12 bg-gray-200 rounded-lg p-2'}>
          {bannerState.icon}
        </View>
        <View className={'flex items-start justify-center px-2'}>
          <Text className={'text-lg font-semibold text-gray-800 truncate'}>
            {bannerState.bannerInstruction.primary.text}
          </Text>
          {/*{maneuver != null && (*/}
          {/*  <Text className={'text-md font-normal text-gray-600'}>*/}
          {/*    {maneuver?.instruction}*/}
          {/*  </Text>*/}
          {/*)}*/}
        </View>
      </View>
    </>
  );
};
