import type {FunctionComponent, PropsWithChildren} from 'react';
import React from 'react';
import Mapbox from '@rnmapbox/maps';
import {Navigation} from './modules/navigation/navigation.tsx';

void Mapbox.setAccessToken(
  'pk.eyJ1IjoidXJiYW5jaHJpc3kiLCJhIjoiY2xzbGo5cnhwMGVoazJqcDY0N3RqeG92OSJ9.C9sIOo45b61JpdvgbMhtVw',
);

export type MainProps = PropsWithChildren<{}>;

export const Main: FunctionComponent<MainProps> = props => {
  const {} = props;
  return <Navigation />;
};

// {/*<NavigationContainer*/}
// {/*  options={{*/}
{
  /*    waypoints: [*/
}
{
  /*      [174.57475042052357, -36.12624582858391],*/
}
{
  /*      [174.51183209118108, -36.23607992909409],*/
}
{
  /*    ],*/
}
// {/*  }}*/}
// {/*/>*/}
// {/*<NavigationView*/}
// {/*  waypoints={[*/}
// {/*    [174.5150448102604, -36.10380044213468],*/}
// {/*    [174.51839819908247, -36.10715850307111],*/}
// {/*    [174.57475042052357, -36.12624582858391],*/}
// {/*    [174.51183209118108, -36.23607992909409],*/}
// {/*  ]}*/}
// {/*/>*/}
