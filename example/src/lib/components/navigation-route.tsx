import * as Mapbox from '@rnmapbox/maps';
import * as turf from '@turf/turf';
import chroma from 'chroma-js';
import React, {
  FunctionComponent,
  PropsWithChildren,
  useEffect,
  useState,
} from 'react';
// import { useAnimatedProps, useSharedValue } from "react-native-reanimated";
// import { useDebouncedState } from "../hooks/use-debounced-state";
// import { UserLocation } from "../services/blackbox";
import {NavigationService} from '../services/navigation.service';
import * as GeoJSON from 'geojson';
import {Leg} from '@mapbox/mapbox-sdk/services/directions';
import {View} from 'react-native';
import {NavigationState} from '../services/blackbox/event.types';

export type RouteGeometry = GeoJSON.LineString | GeoJSON.MultiLineString;
export interface Route<T extends RouteGeometry> {
  /**
   * Depending on the geometries parameter this is a GeoJSON LineString or a Polyline string.
   * Depending on the overview parameter this is the complete route geometry (full), a simplified geometry
   * to the zoom level at which the route can be displayed in full (simplified), or is not included (false)
   */
  geometry: T;
  /**
   * Array of RouteLeg objects.
   */
  legs: Leg[];
  /**
   * String indicating which weight was used. The default is routability which is duration-based,
   * with additional penalties for less desirable maneuvers.
   */
  weight_name: string;
  /**
   * Float indicating the weight in units described by weight_name
   */
  weight: number;
  /**
   * Float indicating the estimated travel time in seconds.
   */
  duration: number;
  /**
   * Float indicating the distance traveled in meters.
   */
  distance: number;
  /**
   * String of the locale used for voice instructions. Defaults to en, and can be any accepted instruction language.
   */
  voiceLocale?: string | undefined;
}

export type NavigationRouteProps = PropsWithChildren<{
  navigationService: NavigationService;
}>;

export const NavigationRoute: FunctionComponent<
  NavigationRouteProps
> = props => {
  const {navigationService} = props;

  const navigationLineRef = React.useRef<Mapbox.ShapeSource>(null);

  // const [navigationRoute, setNavigationRoute] =
  //   useState<Route<GeoJSON.LineString> | null>(null);

  const [navigationState, setNavigationState] =
    useState<NavigationState | null>(null);

  useEffect(() => {
    const directionsListener = navigationService.blackbox.emitter.on(
      'NAVIGATION_ROUTE_CHANGED',
      ({payload: {navigationRoute}}) => {
        // setNavigationRoute(navigationRoute);
        // navigationLineRef.current?.setNativeProps({
        //   id: 'navigation-route',
        //   shape: JSON.stringify(navigationRoute.geometry),
        // });
      },
    );

    const navigationStateListener = navigationService.blackbox.emitter.on(
      'NAVIGATION_STATE_CHANGED',
      ({payload: {state}}) => {
        console.log('state', state);
        setNavigationState(state);
      },
    );

    return () => {
      directionsListener.remove();
      navigationStateListener.remove();
    };
  }, [navigationService]);

  if (navigationState == null) {
    return null;
  }

  console.log('navigationState', navigationState.segmentSlicedToUser);

  return (
    <>
      <Mapbox.Camera
        followUserLocation
        followPadding={{
          paddingLeft: 100,
          paddingRight: 100,
          paddingTop: 100,
          paddingBottom: 100,
        }}
        followHeading={0}
        followZoomLevel={17}
        followPitch={35}
        animationDuration={0}
        // centerCoordinate={[
        //   userLocation.coords.longitude,
        //   userLocation.coords.latitude,
        // ]}
        // heading={userLocation.coords.heading}
        followUserMode={Mapbox.UserTrackingMode.FollowWithHeading}
      />

      <Mapbox.LocationPuck puckBearing="course" />

      <Mapbox.ShapeSource
        id="navigation-route"
        ref={navigationLineRef}
        shape={navigationState.segmentSlicedToUser}>
        <Mapbox.LineLayer
          id="navigation-route-line"
          style={{
            lineColor: 'green',
            lineWidth: 4,
            lineSortKey: 1,
            // visibility: visible ? "visible" : "none",
          }}
        />
      </Mapbox.ShapeSource>
    </>
  );

  // const userLocation = navigationService.blackbox.getUserLocation();

  // if (userLocation == null) {
  //   return null;
  // }

  // const closedPoint = turf.nearestPointOnLine(
  //   navigationRoute.geometry,
  //   userLocation.coords.reverse(),
  //   {
  //     units: 'meters',
  //   },
  // );

  // const sliced = turf.lineSlice(
  //   turf.point(userLocation.coords.reverse()),
  //   navigationRoute.geometry.coordinates[
  //     navigationRoute.geometry.coordinates.length - 1
  //   ],
  //   navigationRoute.geometry,
  // );

  // console.log('navigationRoute1', navigationRoute.geometry);

  // split the line at the nearest point and return the ramining route

  // const lineSplit = turf.lineSplit(
  //   navigationRoute.geometry,
  //   [closedPoint],
  // );

  // const lineSplit = turf.lineSplit(navigationRoute.geometry, closedPoint);
  // console.log('lineSplit', lineSplit)

  // return null;
  //
  // console.log('closedPoint', closedPoint);
  //
  // if (lineSplit.features.length < 2) {
  //   return null;
  // }

  // const completedRoute = lineSplit.features[0];
  const remainingRoute = sliced;

  const totalDistance = turf.length(turf.feature(navigationRoute.geometry), {
    units: 'kilometers',
  });
  // const completedDistance = turf.length(completedRoute, {
  //   units: 'kilometers',
  // });
  const remainingDistance = turf.length(remainingRoute, {
    units: 'kilometers',
  });

  // const completedPercentage = (completedDistance / totalDistance) * 100;
  const remainingPercentage = (remainingDistance / totalDistance) * 100;
  const remainingTime = remainingDistance / (userLocation.speed ?? 0);

  console.log('totalDistance', totalDistance.toFixed(2));

  // const linesSegments = turf.lineSegment(navigationRoute.geometry);
  // const lineSlice = turf.lineSplit(turf.mul, closedPoint);

  // console.log('closedPoint', closedPoint.geometry.coordinates);

  return (
    <>
      {/*<BottomSheet index={0} inline safe hideBackdrop>*/}
      {/*  <Text>{completedPercentage.toFixed(2)}%</Text>*/}
      {/*  <Text>{remainingPercentage.toFixed(2)}%</Text>*/}
      {/*  <Text>{totalDistance.toFixed(2)} km</Text>*/}
      {/*</BottomSheet>*/}

      {/*<Mapbox.MarkerView*/}
      {/*  id="marker2"*/}
      {/*  coordinate={[...closedPoint.geometry.coordinates]}>*/}
      {/*  <View*/}
      {/*    style={{*/}
      {/*      //tw`w-2 h-2 bg-semantic-success-foreground-bold rounded-full`*/}
      {/*      width: 10,*/}
      {/*      height: 10,*/}
      {/*      backgroundColor: 'green',*/}
      {/*      borderRadius: 20,*/}
      {/*    }}*/}
      {/*  />*/}
      {/*</Mapbox.MarkerView>*/}

      {/*<Mapbox.ShapeSource id="full-route" shape={navigationRoute.geometry}>*/}
      {/*  <Mapbox.LineLayer*/}
      {/*    id="full-route-line"*/}
      {/*    style={{*/}
      {/*      lineColor: chroma('green').alpha(0.4).hex(),*/}
      {/*      lineWidth: 5,*/}
      {/*      lineCap: 'round',*/}
      {/*      lineSortKey: 2,*/}
      {/*      // visibility: visible ? "visible" : "none",*/}
      {/*    }}*/}
      {/*  />*/}
      {/*</Mapbox.ShapeSource>*/}

      {/*<Mapbox.ShapeSource*/}
      {/*  id="navigation-step"*/}
      {/*  ref={navigationStepRef}*/}
      {/*  shape={allStepGeo}*/}
      {/*>*/}
      {/*  <Mapbox.LineLayer*/}
      {/*    id="navigation-step-line"*/}
      {/*    style={{*/}
      {/*      lineColor: tw.color("semantic-critical-foreground-bold"),*/}
      {/*      lineWidth: 4,*/}
      {/*      // visibility: visible ? "visible" : "none",*/}
      {/*    }}*/}
      {/*  />*/}
      {/*  <Mapbox.CircleLayer*/}
      {/*    id="navigatiasde"*/}
      {/*    style={{*/}
      {/*      circleColor: tw.color("semantic-success-foreground-bold"),*/}
      {/*      circleRadius: 2,*/}
      {/*    }}*/}
      {/*  />*/}
      {/*</Mapbox.ShapeSource>*/}
    </>
  );
};
