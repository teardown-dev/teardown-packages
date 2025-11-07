import type {FunctionComponent, PropsWithChildren} from 'react';
import React from 'react';
import {View} from 'react-native';
import * as GeoJson from 'geojson';

export type NavigationRouteProps = PropsWithChildren<{
  waypoints: GeoJson.Position[];
}>;

export const NavigationRoute: FunctionComponent<
  NavigationRouteProps
> = props => {
  const {} = props;
  return <View />;
};
