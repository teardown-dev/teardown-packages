import type {FunctionComponent, PropsWithChildren} from 'react';
import React from 'react';
import {View} from 'react-native';
import {useRoute} from '../hooks/use-route.ts';
import Mapbox from '@rnmapbox/maps';

export type FullPathProps = PropsWithChildren<{}>;

export const FullPath: FunctionComponent<FullPathProps> = (props) => {
  const route = useRoute();

  if (route == null) {
    return null;
  }

  return (
    <>
      <Mapbox.ShapeSource id="full-path" shape={route.geometry}>
        <Mapbox.LineLayer
          id="full-path-line"
          layerIndex={110}
          style={{
            lineColor: '#b4bb43',
            lineWidth: 4,
            lineSortKey: 1,
          }}
        />
      </Mapbox.ShapeSource>
    </>
  );
};
