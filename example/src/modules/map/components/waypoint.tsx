import type {FunctionComponent, PropsWithChildren} from 'react';
import React from 'react';
import {View} from 'react-native';

export type WaypointProps = PropsWithChildren<{}>;

export const Waypoint: FunctionComponent<WaypointProps> = props => {
  const {} = props;
  return <View />;
};
