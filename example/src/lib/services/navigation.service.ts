import {useContext, createContext, useMemo} from 'react';
import {NavigationClient} from '../navigation.client.ts';

export type NavigationServiceContextType = {
  navigationClient: NavigationClient;
};

const Context = createContext<NavigationServiceContextType | null>(null);

export type NavigationOptions = {
  waypoints: GeoJSON.Position[];
};

export const NavigationService = {
  Context,
  Provider: Context.Provider,

  useState() {
    const state = useContext(Context);
    if (state == null) {
      throw new Error('NavigationService not found');
    }
    return state;
  },

  useProvidedState(options: NavigationOptions): NavigationServiceContextType {
    const {waypoints} = options;

    const navigationClient = useMemo(() => {
      return new NavigationClient({
        accessToken:
          'pk.eyJ1IjoidXJiYW5jaHJpc3kiLCJhIjoiY2xzbGo5cnhwMGVoazJqcDY0N3RqeG92OSJ9.C9sIOo45b61JpdvgbMhtVw',
        waypoints,
      });
    }, [waypoints]);

    return {
      navigationClient,
    };
  },
};
