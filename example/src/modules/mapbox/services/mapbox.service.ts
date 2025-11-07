import {useContext, createContext, useMemo} from 'react';
import {MapboxService as LibMapboxService} from '../../../lib/modules/mapbox';

export type MapboxServiceContextType = {
  mapbox: LibMapboxService;
};

const Context = createContext<MapboxServiceContextType | null>(null);

export const MapboxService = {
  Context,
  Provider: Context.Provider,

  useState() {
    const state = useContext(Context);
    if (state == null) {
      throw new Error('MapboxService not found');
    }
    return state;
  },

  useProvidedState(): MapboxServiceContextType {
    const mapbox = useMemo(() => {
      return new LibMapboxService(
        'pk.eyJ1IjoidXJiYW5jaHJpc3kiLCJhIjoiY2xzbGo5cnhwMGVoazJqcDY0N3RqeG92OSJ9.C9sIOo45b61JpdvgbMhtVw',
      );
    }, []);

    return {
      mapbox,
    };
  },
};
