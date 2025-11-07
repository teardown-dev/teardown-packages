import type {FunctionComponent, PropsWithChildren} from 'react';
import React from 'react';
import {Pressable, View} from 'react-native';
import {NavigationService} from '../../../services/navigation.service.ts';
import {useCameraLock} from '../../camera';
import {LocateOff, Locate, LocateFixed} from 'lucide-react-native';
import {useUserLocationVisible} from '../hooks';
import {Icon} from '../../../../components/icon.tsx';

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
      <Icon
        variant={isLocationVisible ? 'subtle' : 'default'}
        // className={
        //   'w-14 h-14 bg-black rounded-full flex items-center justify-center active:bg-black z-40 pointer-events-auto'
        // }
        onPress={onPress}>
        {isLocationVisible ? <LocateFixed /> : <LocateOff />}
      </Icon>
    </>
  );
};
