import type {FunctionComponent, PropsWithChildren} from 'react';
import React from 'react';
import {NavigationService} from '../../../services/navigation.service';
import Mapbox from '@rnmapbox/maps';
import {useUserLocationVisible} from '../hooks';
import * as turf from '@turf/turf';
import {useNavigationState} from '../../navigation';

export type UserLocationPuckProps = PropsWithChildren<{}>;

export const UserLocationPuck: FunctionComponent<
  UserLocationPuckProps
> = props => {
  const {} = props;

  const {navigationClient} = NavigationService.useState();

  const isLocationVisible = useUserLocationVisible();
  const state = useNavigationState();

  const onUserLocationUpdate = (location: Mapbox.Location) => {
    navigationClient.userLocationService.setUserLocation(location);
  };

  return (
    <>
      <Mapbox.UserLocation
        visible={isLocationVisible}
        requestsAlwaysUse
        showsUserHeadingIndicator
        onUpdate={onUserLocationUpdate}
      />

      {state != null && (
        <Mapbox.ShapeSource
          id="user-location-puck"
          shape={turf.point(
            state.stepProgress.remainingPath.geometry.coordinates[0],
          )}>
          <Mapbox.CircleLayer
            id="user-location-puck-circle-2"
            layerIndex={130}
            style={{
              circleColor: 'black',
              circleStrokeColor: '#15bb43',
              circleStrokeWidth: 6,
              circleRadius: 8,
              circlePitchAlignment: 'map',
            }}
          />
          {/*<Mapbox.CircleLayer*/}
          {/*  id="user-location-puck-circle-1"*/}
          {/*  layerIndex={131}*/}
          {/*  style={{*/}
          {/*    circleColor: 'white',*/}
          {/*    circleRadius: 10,*/}
          {/*    circlePitchAlignment: 'map',*/}
          {/*  }}*/}
          {/*/>*/}
        </Mapbox.ShapeSource>
      )}
    </>
  );
};
