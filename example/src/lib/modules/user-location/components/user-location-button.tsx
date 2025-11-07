import type {FunctionComponent, PropsWithChildren} from 'react';
import React from 'react';
import {Pressable, View} from 'react-native';
import {NavigationService} from '../../../services/navigation.service.ts';
import {useCameraLock} from '../../camera';
import {LocateOff, Locate} from 'lucide-react-native';
import {useUserLocationVisible} from '../hooks';

export type UserLocationButtonProps = PropsWithChildren<{}>;

export const UserLocationButton: FunctionComponent<
  UserLocationButtonProps
> = props => {
  const {navigationClient} = NavigationService.useState();

  const isLocationVisible = useUserLocationVisible();

  const onPress = () => {
    navigationClient.userLocationService.setVisibility(!isLocationVisible);
  };

  return (
    <>
      <Pressable
        className={
          'w-14 h-14 bg-black rounded-full flex items-center justify-center active:bg-black z-40 pointer-events-auto'
        }
        onPress={onPress}>
        <View className={''}>
          {isLocationVisible ? (
            <Locate size={20} color={'white'} />
          ) : (
            <LocateOff size={20} color={'white'} />
          )}
        </View>
      </Pressable>
    </>
  );
};
