import {FunctionComponent, PropsWithChildren} from 'react';
import {MapboxService} from '../services/mapbox.service.ts';

export type MapboxContainerProps = PropsWithChildren<{}>;

export const MapboxContainer: FunctionComponent<
  MapboxContainerProps
> = props => {
  const {children} = props;

  const providedState = MapboxService.useProvidedState();

  return (
    <MapboxService.Provider value={providedState}>
      {children}
    </MapboxService.Provider>
  );
};
