import {NavigationService} from '../../../services/navigation.service.ts';
import {useEffect, useState} from 'react';

export const useNavigationState = () => {
  const {navigationClient} = NavigationService.useState();

  const [value, setValue] = useState(
    navigationClient.navigationState.getNavigationState(),
  );

  useEffect(() => {
    const listener = navigationClient.navigationState.emitter.on(
      'NAVIGATION_STATE_CHANGED',
      ({payload: {state}}) => {
        setValue(state);
      },
    );

    return () => {
      listener.remove();
    };
  }, [navigationClient.navigationState.emitter]);

  return value;
};
