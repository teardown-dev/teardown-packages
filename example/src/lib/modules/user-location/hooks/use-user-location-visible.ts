import {NavigationService} from '../../../services/navigation.service.ts';
import {useEffect, useState} from 'react';

export const useUserLocationVisible = () => {
  const {navigationClient} = NavigationService.useState();

  const [isVisible, setIsVisible] = useState(
    navigationClient.userLocationService.isVisible(),
  );

  useEffect(() => {
    const navigationStateListener =
      navigationClient.userLocationService.emitter.on(
        'USER_LOCATION_VISIBILITY_CHANGED',
        ({payload}) => {
          setIsVisible(payload.isVisible);
        },
      );

    return () => {
      navigationStateListener.remove();
    };
  }, [navigationClient.userLocationService.emitter]);

  return isVisible;
};
