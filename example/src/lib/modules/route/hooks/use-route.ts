import {NavigationService} from '../../../services/navigation.service.ts';
import {useEffect, useState} from 'react';

export const useRoute = () => {
  const {navigationClient} = NavigationService.useState();

  const [route, setRoute] = useState(
    navigationClient?.routeService.getNavigationRoute() ?? null,
  );

  useEffect(() => {
    const routeListener = navigationClient.routeService.emitter.on(
      'DIRECTIONS_CHANGED',
      () => {
        setRoute(navigationClient.routeService.getNavigationRoute());
      },
    );

    return () => {
      routeListener.remove();
    };
  }, [navigationClient.routeService, navigationClient.routeService.emitter]);

    return route;
};
