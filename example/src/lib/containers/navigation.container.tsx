import React, {
  FunctionComponent,
  PropsWithChildren,
  useEffect,
  useState,
} from 'react';
import {
  NavigationOptions,
  NavigationService,
} from '../services/navigation.service.ts';
import {PortalProvider} from '@gorhom/portal';
import {SafeAreaView, View} from 'react-native';
import Mapbox from '@rnmapbox/maps';
import * as turf from '@turf/turf';
import {BannerInstructions} from '../modules/banner';
import {useNavigationState} from '../modules/navigation';
import {UserLocationPuck} from '../modules/user-location';
import {FullPath} from '../modules/route';
import {ManeuverLocations} from '../modules/maneuver';

export type NavigationContainerProps = PropsWithChildren<{
  options: NavigationOptions;
}>;

const LayerIndex = {
  UserPuck: 130,
  Route: 90,
};

export const NavigationContainer: FunctionComponent<
  NavigationContainerProps
> = props => {
  const {children, options} = props;

  const providedState = NavigationService.useProvidedState(options);

  return (
    <View className={'flex-1 relative'}>
      <NavigationService.Provider value={providedState}>
        <PortalProvider>
          {/*{children}*/}

          <Mapbox.MapView
            style={{
              flex: 1,
            }}
            compassEnabled={false}
            scaleBarEnabled={false}
            onCameraChanged={state =>
              providedState.navigationClient.cameraService.onCameraChanged(
                state,
              )
            }>
            <Mapbox.Camera
              ref={providedState.navigationClient.cameraService.ref}
            />
            <FullPath />
            <NavigationRoute />
            <UserLocationPuck />
            <ManeuverLocations />
            <View
              className={
                'absolute top-0 bottom-0 left-0 right-0 pointer-events-box-none'
              }>
              <SafeAreaView className={'flex-1 pointer-events-box-none'}>
                <View className={'flex-1 p-4 gap-4 pointer-events-box-none'}>
                  <View className={'border'}>
                    <BannerInstructions />
                  </View>

                  <View className={'flex-1 flex-row pointer-events-box-none'}>
                    <View className={'p-4 pointer-events-box-none'} />
                    <View className={'flex-1 pointer-events-box-none'} />
                    <View className={'p-4 pointer-events-box-none'}>
                      {/*<CameraLockButton />*/}
                      {/*<UserLocationButton />*/}
                    </View>
                  </View>
                </View>
              </SafeAreaView>
            </View>
          </Mapbox.MapView>
        </PortalProvider>
      </NavigationService.Provider>
    </View>
  );
};

export const useManeuver = () => {
  const {navigationClient} = NavigationService.useState();

  const [maneuver, setManeuver] = useState(
    navigationClient.maneuverService.getManeuverState(),
  );

  useEffect(() => {
    const maneuverListener = navigationClient.maneuverService.emitter.on(
      'MANEUVER_STATE_CHANGED',
      ({payload: {state}}) => {
        setManeuver(state);
      },
    );

    return () => {
      maneuverListener.remove();
    };
  }, [navigationClient.maneuverService.emitter]);

  return maneuver;
};

const NavigationRoute: FunctionComponent = () => {
  const state = useNavigationState();

  if (state == null) {
    return null;
  }

  const {stepProgress, legProgress} = state;

  // const maneuverLocation =
  //   maneuver?.location != null ? turf.point(maneuver.location) : null;

  return (
    <>
      <Mapbox.ShapeSource
        id="navigation-route"
        shape={stepProgress.remainingPath}>
        <Mapbox.LineLayer
          id="navigation-route-line"
          layerIndex={120}
          style={{
            lineColor: '#77bb43',
            lineWidth: 4,
            lineSortKey: 1,
            // visibility: visible ? "visible" : "none",
          }}
        />
      </Mapbox.ShapeSource>

      <Mapbox.ShapeSource
        id="route-endpoint"
        shape={turf.point(
          stepProgress.remainingPath.geometry.coordinates[
            stepProgress.remainingPath.geometry.coordinates.length - 1
          ],
        )}>
        <Mapbox.CircleLayer
          id="route-endpoint-circle"
          style={{
            circleColor: '#77bb43',
            circleRadius: 6,
            circlePitchAlignment: 'map',
          }}
        />
      </Mapbox.ShapeSource>
    </>
  );
};
