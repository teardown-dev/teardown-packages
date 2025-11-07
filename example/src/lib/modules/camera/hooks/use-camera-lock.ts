import {NavigationService} from '../../../services/navigation.service.ts';
import {useEffect, useState} from 'react';

export const useCameraLock = () => {
  const {navigationClient} = NavigationService.useState();

  const [isLocked, setIsLocked] = useState(
    navigationClient.cameraService.isLocked(),
  );

  useEffect(() => {
    const navigationStateListener = navigationClient.cameraService.emitter.on(
      'CAMERA_LOCK_CHANGED',
      ({payload}) => {
        setIsLocked(payload.isLocked);
      },
    );

    return () => {
      navigationStateListener.remove();
    };
  }, [navigationClient.cameraService.emitter]);

  return isLocked;
};
