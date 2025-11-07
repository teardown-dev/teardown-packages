import {NavigationService} from '../../../services/navigation.service.ts';
import {useEffect, useState} from 'react';

export const useManeuver = () => {
  const {navigationClient} = NavigationService.useState();

  const [maneuver, setManeuver] = useState(
    navigationClient.maneuverService.getManeuverState(),
  );

  useEffect(() => {
    const navigationStateListener = navigationClient.maneuverService.emitter.on(
      'MANEUVER_STATE_CHANGED',
      ({payload}) => {
        setManeuver(payload.state);
      },
    );

    return () => {
      navigationStateListener.remove();
    };
  }, [navigationClient.maneuverService.emitter]);

  return maneuver;
};
