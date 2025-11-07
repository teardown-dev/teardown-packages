import Mapbox from '@rnmapbox/maps';
import React, {type FunctionComponent, useMemo} from 'react';

import {UserLocationPuck} from './user-location-puck';
import {BannerInstructions} from './banner-instructions';
import {ManeuverLocations} from './maneuver-locations';
import {NavigationRoute} from './navigation-route';
import {NavigationService} from '../services/navigation.service';

export type NavigationViewProps = {
  waypoints: [number, number][];
};

export const NavigationView: FunctionComponent<NavigationViewProps> = props => {
  const {waypoints} = props;

  const navigationService = useMemo(() => {
    return new NavigationService(waypoints);
  }, [waypoints]);

  if (navigationService == null) {
    return null;
  }

  return (
    <>
      <Mapbox.MapView
        style={{
          flex: 1,
        }}
        compassEnabled
        scaleBarEnabled={false}
        onCameraChanged={state => {
        // console.log('state', state);
          // navigationService.blackbox.setCamera(state.properties);
        }}>
        {/*<Mapbox.Camera ref={navigationService.camera.ref} />*/}
        <NavigationRoute navigationService={navigationService} />
        <ManeuverLocations navigationService={navigationService} />
        <UserLocationPuck navigationService={navigationService} />
      </Mapbox.MapView>
      <BannerInstructions navigationService={navigationService} />
    </>
  );
};
