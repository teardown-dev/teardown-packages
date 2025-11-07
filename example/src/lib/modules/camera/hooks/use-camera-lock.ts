import {useEffect, useState} from 'react';
import {CameraService} from '../services';

export const useCameraLock = (cameraService: CameraService) => {
  const [isLocked, setIsLocked] = useState(cameraService.isLocked());

  useEffect(() => {
    const navigationStateListener = cameraService.emitter.on(
      'CAMERA_LOCK_CHANGED',
      ({payload}) => {
        setIsLocked(payload.isLocked);
      },
    );

    return () => {
      navigationStateListener.remove();
    };
  }, [cameraService.emitter]);

  return isLocked;
};
