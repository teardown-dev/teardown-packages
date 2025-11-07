import type {FunctionComponent, PropsWithChildren} from 'react';
import React from 'react';
import {View} from 'react-native';
import {Portal, PortalHost} from '@gorhom/portal';

export type MapPortalProps = PropsWithChildren<{}>;

const PORTAL_NAME = 'map';

export const MapPortal: FunctionComponent<MapPortalProps> = props => {
  const {children} = props;
  return <Portal hostName={PORTAL_NAME}>{children}</Portal>;
};

export const MapPortalHost: FunctionComponent = () => {
  return <PortalHost name={PORTAL_NAME} />;
};
