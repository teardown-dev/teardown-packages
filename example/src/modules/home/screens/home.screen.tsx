import React, {
  FunctionComponent,
  PropsWithChildren,
  useRef,
  useState,
} from 'react';
import {View} from 'react-native';
import {
  BottomSheet,
  BottomSheetModal,
} from '../../../components/bottom-sheet.tsx';
import Mapbox from '@rnmapbox/maps';
import {Text} from '../../../components/text';
import {FlatList} from 'react-native-gesture-handler';
import {Interactive} from '../../../components/interactive.tsx';
import {TourQueries} from '../../tours/queries/tour.queries.ts';
import {useNavigationState} from '../../../lib/modules/navigation';
import * as turf from '@turf/turf';
import {Overlay} from '../components/overlay.tsx';
import {HomeSheet} from '../sheets/home.sheet.tsx';
import {HomeService} from '../services/home.service.ts';
import {BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import {Map} from '../../map/map.tsx';

export type MapScreenProps = PropsWithChildren<{}>;

export const HomeScreen: FunctionComponent<MapScreenProps> = props => {
  const {} = props;

  const [offset, setOffset] = useState(0);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const toursBottomSheet = useRef<BottomSheetModal>(null);

  // const providedState = NavigationService.useProvidedState({
  //   waypoints: [
  //     [174.57475042052357, -36.12624582858391],
  //     [174.51183209118108, -36.23607992909409],
  //   ],
  // });

  const providedState = HomeService.useProvidedState();

  return (
    <HomeService.Provider value={providedState}>
      <BottomSheetModalProvider>
        <View className={'flex-1'}>
          <Map />
          <Overlay />
          <HomeSheet />
        </View>
      </BottomSheetModalProvider>
    </HomeService.Provider>
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
              <Text variant={'heading'}>{item.name}</Text>
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
