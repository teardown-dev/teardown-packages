import type {FunctionComponent, PropsWithChildren} from 'react';
import React from 'react';
import * as turf from '@turf/turf';
import {useRoute} from '../../route';
import Mapbox from '@rnmapbox/maps';

export type ManeuverLocationsProps = PropsWithChildren<{}>;

export const ManeuverLocations: FunctionComponent<
  ManeuverLocationsProps
> = props => {
  const {} = props;

  const route = useRoute();

  if (route == null) {
    return null;
  }

  const allManeuvers =
    route.legs.flatMap(leg => leg.steps.map(step => step.maneuver)) ?? [];

  const allManeuverLocations = allManeuvers.map(maneuver =>
    turf.point(maneuver.location),
  );

  return (
    <>
      {/*<Mapbox.ShapeSource*/}
      {/*  id="manuever-locations"*/}
      {/*  shape={turf.featureCollection(allManeuverLocations)}>*/}
      {/*  <Mapbox.CircleLayer*/}
      {/*    id="manuever-location-circle"*/}
      {/*    style={{*/}
      {/*      circleColor: 'red',*/}
      {/*      circleRadius: 2,*/}
      {/*    }}*/}
      {/*  />*/}
      {/*</Mapbox.ShapeSource>*/}
    </>
  );
};
