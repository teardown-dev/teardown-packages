import React, {FunctionComponent} from 'react';
import {MapPortal, MapPortalHost} from './components/map-portal.tsx';
import {Keyboard} from 'react-native';
import Mapbox from '@rnmapbox/maps';
import {HomeService} from '../home/services/home.service.ts';

export type MapProps = {};

export const Map: FunctionComponent<MapProps> = props => {
  const {} = props;

  const {control} = HomeService.useState();

  return (
    <Mapbox.MapView
      scaleBarEnabled={false}
      onTouchStart={() => {
        Keyboard.dismiss();
      }}
      gestureSettings={{}}
      onCameraChanged={state => control.cameraService.onCameraChanged(state)}
      onLongPress={feature => {
        switch (feature.geometry.type) {
          case 'Point': {
            control.stateService.navigate({
              type: 'ROUTE_BUILDER',
              waypoints: [feature.geometry.coordinates],
            });
            break;
          }
          default:
            break;
        }
      }}
      style={{
        flex: 1,
      }}>
      <MapPortalHost />
    </Mapbox.MapView>
  );
};
