import {Maneuver} from '@mapbox/mapbox-sdk/services/directions';
import Mapbox from '@rnmapbox/maps';
import * as turf from '@turf/turf';
import React, {
  FunctionComponent,
  PropsWithChildren,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {NavigationState} from '../services/blackbox/event.types';
import {NavigationService} from '../services/navigation.service';

export type ManeuverLocationsProps = PropsWithChildren<{
  navigationService: NavigationService;
}>;

export const ManeuverLocations: FunctionComponent<
  ManeuverLocationsProps
> = props => {
  const {navigationService} = props;

  const [navigationState, setNavigationState] =
    useState<NavigationState | null>(null);

  useEffect(() => {
    const navigationStateListener = navigationService.blackbox.emitter.on(
      'NAVIGATION_STATE_CHANGED',
      ({payload: {state}}) => {
        setNavigationState(state);
      },
    );

    return () => {
      navigationStateListener.remove();
    };
  }, [navigationState, navigationService]);

  const locations = useMemo(() => {
    const navigationRoute = navigationService.blackbox.getNavigationRoute();
    if (navigationRoute == null || navigationState == null) {
      return null;
    }

    const {legs} = navigationRoute;

    return legs.flatMap((leg, legIndex) => {
      return leg.steps.flatMap((step, index) => {
        const line = turf.feature(step.geometry as GeoJSON.LineString);
        const points: GeoJSON.Feature<
          GeoJSON.Point,
          {type: 'maneuver' | 'voice' | 'banner'}
        >[] = [];

        const {location} = step.maneuver;
        const point = turf.point(location);
        points.push({
          ...point,
          properties: {
            ...point.properties,
            type: 'maneuver',
          },
        });

        // step.intersections.forEach((intersection) => {
        //   const { location } = intersection;
        //   const point = turf.point(location);
        //   points.push(point);
        // });

        step.voiceInstructions.forEach(voiceInstruction => {
          const {distanceAlongGeometry} = voiceInstruction;
          const point = turf.along(line, distanceAlongGeometry, {
            units: 'meters',
          });
          points.push({
            ...point,
            properties: {
              ...point.properties,
              type: 'voice',
            },
          });
        });

        step.bannerInstructions.forEach(bannerInstruction => {
          const {distanceAlongGeometry} = bannerInstruction;
          const point = turf.along(line, distanceAlongGeometry, {
            units: 'meters',
          });
          points.push({
            ...point,
            properties: {
              ...point.properties,
              type: 'banner',
            },
          });
        });

        return points;
      });
    });
  }, [navigationState, navigationService.blackbox]);

  const groupedLocations = useMemo(() => {
    if (locations == null) {
      return null;
    }

    const maneuverLocations = locations.filter(location => {
      return location.properties.type === 'maneuver';
    });

    const voiceLocations = locations.filter(location => {
      return location.properties.type === 'voice';
    });

    const bannerLocations = locations.filter(location => {
      return location.properties.type === 'banner';
    });

    return {
      maneuverLocations,
      voiceLocations,
      bannerLocations,
    };
  }, [locations]);

  useEffect(() => {
    const navigationRoute = navigationService.blackbox.getNavigationRoute();

    if (navigationRoute == null || navigationState == null) {
      return;
    }

    const {legs} = navigationRoute;

    const step =
      legs[navigationState.legIndex].steps[navigationState.stepIndex];
    const {maneuver} = step;

    const {bearing_after} = maneuver;

    console.log('ManeuverLocations bearing_after', bearing_after);

    // navigationService.camera.ref.current?.setCamera({
    //   heading: bearing_after,
    // });
  }, [
    navigationService.blackbox,
    navigationService.camera.ref,
    navigationState,
  ]);

  // console.log("ManeuverLocations locations", locations);

  if (groupedLocations == null) {
    return null;
  }

  return (
    <>
      <Mapbox.ShapeSource
        id="manuever-locations"
        shape={turf.featureCollection(groupedLocations.maneuverLocations)}>
        <Mapbox.CircleLayer
          id="manuever-location-circle"
          style={{
            circleColor: 'red',
            circleRadius: 8,
          }}
        />
      </Mapbox.ShapeSource>
      <Mapbox.ShapeSource
        id="voice-locations"
        shape={turf.featureCollection(groupedLocations.voiceLocations)}>
        <Mapbox.CircleLayer
          id="voice-location-circle"
          style={{
            circleColor: 'purple',
            circleRadius: 8,
          }}
        />
      </Mapbox.ShapeSource>
      <Mapbox.ShapeSource
        id="banner-locations"
        shape={turf.featureCollection(groupedLocations.bannerLocations)}>
        <Mapbox.CircleLayer
          id="banner-location-circle"
          style={{
            circleColor: 'blue',
            circleRadius: 8,
          }}
        />
      </Mapbox.ShapeSource>
    </>
  );
};
