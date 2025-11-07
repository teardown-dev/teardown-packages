import React, {
  FunctionComponent,
  PropsWithChildren,
  useRef,
  useState,
} from 'react';
import {Keyboard, SafeAreaView, View} from 'react-native';
import {
  BottomSheet,
  BottomSheetModal,
} from '../../../components/bottom-sheet.tsx';
import Mapbox from '@rnmapbox/maps';
import {Input} from '../../../components/input.tsx';
import {Text} from '../../../components/text';
import {useLayout} from '@react-native-community/hooks';
import {List, LocateOff, Search} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Icon} from '../../../components/icon.tsx';
import {NavigationService} from '../../../lib/services/navigation.service.ts';
import {useQuery} from '@tanstack/react-query';
import {supabaseClient} from '../../supabase/supabase.client.ts';
import {FlatList} from 'react-native-gesture-handler';
import {Interactive} from '../../../components/interactive.tsx';
import {Skeleton} from 'moti/skeleton';
import {MotiView} from 'moti';
import {TourQueries} from '../../tours/queries/tour.queries.ts';
import {ToursBottomSheet} from '../../tours/bottom-sheets/tours.tsx';
import {BannerInstructions} from '../../../lib/modules/banner';
import {CameraLockButton} from '../../../lib/modules/camera';
import {UserLocationButton} from '../../../lib/modules/user-location/components/user-location-button.tsx';
import {FullPath} from '../../../lib/modules/route';
import {UserLocationPuck} from '../../../lib/modules/user-location';
import {ManeuverLocations} from '../../../lib/modules/maneuver';
import {useNavigationState} from '../../../lib/modules/navigation';
import * as turf from '@turf/turf';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/card.tsx';
import {Overlay} from '../components/overlay.tsx';
import {SearchHeader} from '../components/search-header.tsx';

export type MapScreenProps = PropsWithChildren<{}>;

export const HomeScreen: FunctionComponent<MapScreenProps> = props => {
  const {} = props;

  const [offset, setOffset] = useState(0);

  const safeArea = useSafeAreaInsets();

  const bottomSheetLayout = useLayout();

  const bottomSheetRef = useRef<BottomSheet>(null);
  const toursBottomSheet = useRef<BottomSheetModal>(null);

  const providedState = NavigationService.useProvidedState({
    waypoints: [
      [174.57475042052357, -36.12624582858391],
      [174.51183209118108, -36.23607992909409],
    ],
  });

  return (
    <>
      <View className={'flex-1'}>
        <Mapbox.MapView
          scaleBarEnabled={false}
          logoPosition={{
            left: 8,
            bottom: bottomSheetLayout.height,
          }}
          attributionPosition={{
            right: 8,
            bottom: bottomSheetLayout.height,
          }}
          onTouchStart={() => {
            Keyboard.dismiss();
          }}
          style={{
            flex: 1,
          }}
          onCameraChanged={state =>
            providedState.navigationClient.cameraService.onCameraChanged(state)
          }>
          <Mapbox.Camera
            ref={providedState.navigationClient.cameraService.ref}
            // zoomLevel={16}
            // animationMode={'none'}
            // animationDuration={0}
            // padding={{
            //   paddingLeft: 0,
            //   paddingRight: 0,
            //   paddingBottom: bottomSheetLayout.height,
            //   paddingTop: 0,
            // }}
            // Auckland
            // centerCoordinate={[174.7633, -36.8485]}
          />
          {/*<FullPath />*/}
          {/*<NavigationRoute />*/}
          {/*<UserLocationPuck />*/}
          {/*<ManeuverLocations />*/}
        </Mapbox.MapView>

        <Overlay />

        <BottomSheet
          sheetRef={bottomSheetRef}
          // enableContentPanningGesture={false}
          keyboardBehavior={'extend'}
          keyboardBlurBehavior={'restore'}
          snapPoints={['65%']}
          enablePanDownToClose={false}>
          <SearchHeader />
        </BottomSheet>
      </View>

      <ToursBottomSheet sheetRef={toursBottomSheet} />
    </>
  );
};

const Tours: FunctionComponent = () => {
  const {data: tours} = TourQueries.useTours();

  return (
    <View className={'w-full relative'}>
      <FlatList
        horizontal
        className={'w-full'}
        contentContainerStyle={{padding: 14}}
        showsHorizontalScrollIndicator={false}
        data={tours ?? []}
        ItemSeparatorComponent={() => <View className={'w-4'} />}
        renderItem={({item}) => {
          // if (item == null) {
          //   return (
          //     <MotiView
          //       transition={{
          //         type: 'timing',
          //       }}
          //       animate={{
          //         backgroundColor: 'white',
          //       }}
          //       className={
          //         'h-24 w-52 p-4 border border-border-default rounded-md'
          //       }>
          //       <Skeleton colorMode={'dark'} width={'100%'} height={60} />
          //     </MotiView>
          //   );
          // }

          return (
            <Interactive
              className={
                'h-24 w-52 p-4 border border-border-default rounded-md items-start justify-center'
              }>
              <Text type={'heading'}>{item.name}</Text>
              {/*<View className={'flex-1'}>*/}
              {/*  <Mapbox.MapView*/}
              {/*    style={{flex: 1}}*/}
              {/*    zoomEnabled={false}*/}
              {/*    rotateEnabled={false}*/}
              {/*    compassEnabled={false}*/}
              {/*    pitchEnabled={false}*/}
              {/*    scrollEnabled={false}*/}
              {/*    scaleBarEnabled={false}*/}
              {/*    attributionEnabled={false}*/}
              {/*    logoEnabled={false}>*/}
              {/*    <Mapbox.Camera*/}
              {/*      zoomLevel={16}*/}
              {/*      animationMode={'none'}*/}
              {/*      animationDuration={0}*/}
              {/*      padding={{*/}
              {/*        paddingLeft: 0,*/}
              {/*        paddingRight: 0,*/}
              {/*        paddingBottom: 0,*/}
              {/*        paddingTop: 0,*/}
              {/*      }}*/}
              {/*      // Auckland*/}
              {/*      centerCoordinate={[174.7633, -36.8485]}*/}
              {/*    />*/}
              {/*  </Mapbox.MapView>*/}
              {/*</View>*/}
            </Interactive>
          );
        }}
      />
    </View>
  );
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
