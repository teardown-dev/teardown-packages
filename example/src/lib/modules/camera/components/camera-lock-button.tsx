import type {FunctionComponent, PropsWithChildren} from 'react';
import React from 'react';
import {Pressable} from 'react-native';
import {LocateFixed} from 'lucide-react-native';
import {useCameraLock} from '../hooks';
import {NavigationService} from '../../../services/navigation.service.ts';

export type CameraLockButtonProps = PropsWithChildren<{}>;

export const CameraLockButton: FunctionComponent<
  CameraLockButtonProps
> = props => {
  const {} = props;

  const {navigationClient} = NavigationService.useState();

  const isLocked = useCameraLock();

  const onPress = () => {
    if (isLocked) {
      navigationClient.cameraService.unlockCamera();
    } else {
      navigationClient.cameraService.lockCamera();
    }
  };

  return (
    <>
      <Pressable
        className={
          'w-14 h-14 bg-black rounded-full flex items-center justify-center active:bg-black z-40 pointer-events-auto'
        }
        onPress={onPress}>
        <LocateFixed
          className={'w-8 h-8 background'}
          color={isLocked ? 'red' : 'green'}
        />
      </Pressable>
    </>
  );
};
