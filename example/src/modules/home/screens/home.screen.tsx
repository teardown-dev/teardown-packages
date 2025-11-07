import React, {
  FunctionComponent,
  PropsWithChildren,
  useRef,
  useState,
} from 'react';
import {Keyboard, View} from 'react-native';
import {BottomSheet} from '../../../components/bottom-sheet.tsx';
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

export type MapScreenProps = PropsWithChildren<{}>;

export const HomeScreen: FunctionComponent<MapScreenProps> = props => {
  const {} = props;

  const [offset, setOffset] = useState(0);

  const safeArea = useSafeAreaInsets();

  const bottomSheetLayout = useLayout();

  const bottomSheetRef = useRef<BottomSheet>(null);

  const providedState = NavigationService.useProvidedState({
    waypoints: [
      [174.57475042052357, -36.12624582858391],
      [174.51183209118108, -36.23607992909409],
    ],
  });

  return (
    <NavigationService.Provider value={providedState}>
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
          }}>
          <Mapbox.Camera
            zoomLevel={16}
            animationMode={'none'}
            animationDuration={0}
            padding={{
              paddingLeft: 0,
              paddingRight: 0,
              paddingBottom: bottomSheetLayout.height,
              paddingTop: 0,
            }}
            // Auckland
            centerCoordinate={[174.7633, -36.8485]}
          />
        </Mapbox.MapView>

        <BottomSheet
          sheetRef={bottomSheetRef}
          // enableContentPanningGesture={false}
          snapPoints={['65']}
          enablePanDownToClose={false}
          enableDismissOnClose={false}>
          <>
            <View className={'p-4 flex-row gap-2'}>
              <View className={'flex-1'}>
                <Input
                  inBottomSheet
                  leftIcon={<Search color={'white'} size={24} />}
                  placeholder={'Search'}
                />
              </View>
              {/*<View*/}
              {/*  className={*/}
              {/*    'h-full aspect-square bg-interactive-subtle-surface rounded-2xl justify-center items-center'*/}
              {/*  }>*/}
              {/*  <Locate color={'white'} size={24} />*/}
              {/*</View>*/}

              <Icon>
                <List />
              </Icon>

              {/*<GPSLocateButton />*/}
            </View>
          </>
          <Tours />
        </BottomSheet>
      </View>
    </NavigationService.Provider>
  );
};

const GPSLocateButton: FunctionComponent = () => {
  const onLocatePress = () => {
    console.log('locate pressed');
  };

  return (
    <Icon onPress={onLocatePress}>
      <LocateOff />
    </Icon>
  );
};

const Tours: FunctionComponent = () => {
  const {data: tours} = useQuery({
    queryKey: ['tours'],
    queryFn: async () => {
      const {data} = await supabaseClient
        .from('tour')
        .select('*')
        .throwOnError();
      return data ?? [];
    },
  });

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
