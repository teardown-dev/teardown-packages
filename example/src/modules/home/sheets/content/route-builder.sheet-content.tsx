import type {FunctionComponent, PropsWithChildren} from 'react';
import React from 'react';
import {View} from 'react-native';
import {RouteBuilderState} from '../../services/state.service.ts';

export type RouteBuilderSheetContentProps = PropsWithChildren<{
  state: RouteBuilderState;
}>;

export const RouteBuilderSheetContent: FunctionComponent<
  RouteBuilderSheetContentProps
> = props => {
  const {} = props;
  return <View />;
};
