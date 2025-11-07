import * as Mapbox from "@rnmapbox/maps";
import React, {
  FunctionComponent,
  PropsWithChildren,
  useCallback,
  useEffect,
} from "react";
import {NavigationService} from "../services/navigation.service";

export type UserLocationPuckProps = PropsWithChildren<{
  navigationService: NavigationService;
}>;

export const UserLocationPuck: FunctionComponent<UserLocationPuckProps> = (
  props,
) => {
  const { navigationService } = props;
  const navigationPositionRef = React.useRef<Mapbox.ShapeSource>(null);

  const onUserLocationUpdate = useCallback(
    (location: Mapbox.Location) => {
      navigationService?.blackbox.setUserLocation(location);
    },
    [navigationService],
  );

  useEffect(() => {
    const navigationStateChangedListener =
      navigationService.blackbox.emitter.on(
        "NAVIGATION_STATE_CHANGED",
        ({ payload: { state } }) => {
          const snapToLocation = JSON.stringify(state.snapToLocation);
          navigationPositionRef.current?.setNativeProps({
            id: "navigation-current-position",
            shape: snapToLocation,
          });
        },
      );

    return () => {
      navigationStateChangedListener.remove();
    };
  }, [navigationService]);

  return (
    <>
      <Mapbox.ShapeSource
        id="navigation-current-position"
        // ref={navigationPositionRef}
      >
        <Mapbox.CircleLayer
          id="navigation-current-position-circle"
          style={{
            // circleColor: tw.color("semantic-success-foreground-bold"),
            circleRadius: 8,
            circleStrokeColor: "black",
            circleStrokeWidth: 4,
          }}
        />
      </Mapbox.ShapeSource>
      <Mapbox.UserLocation
        minDisplacement={2}
        requestsAlwaysUse
        onUpdate={onUserLocationUpdate}
      />
    </>
  );
};
