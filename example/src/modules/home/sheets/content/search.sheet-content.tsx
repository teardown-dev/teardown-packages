import React, {FunctionComponent, useEffect, useRef, useState} from 'react';
import {View} from 'react-native';
import {Input} from '../../../../components/input.tsx';
import {
  ArrowRight,
  Cog,
  List,
  Navigation2,
  Navigation2Off,
  Search,
} from 'lucide-react-native';
import {Icon} from '../../../../components/icon.tsx';
import {ToursBottomSheet} from '../../../tours/bottom-sheets/tours.tsx';
import {useFocus} from '../../../../hooks/use-focus.ts';
import {useTextInput} from '../../../../hooks/use-text-input.ts';
import {MapboxQueries} from '../../../mapbox/queries/mapbox.queries.ts';
import {Text} from '../../../../components/text.tsx';
import {BottomSheetFlatList} from '../../../../components/bottom-sheet.tsx';
import {MapPortal} from '../../../map/components/map-portal.tsx';
import Mapbox from '@rnmapbox/maps';
import {HomeService} from '../../services/home.service.ts';
import {UserLocationPuck} from '../../../../lib/modules/user-location';
import {OverlayPortal} from '../../components/overlay.tsx';
import {useNavigation} from '../../../navigation/useNavigation.ts';
import * as turf from '@turf/turf';
import {SearchState} from '../../services/state.service.ts';
import {useCameraLock} from '../../../../lib/modules/camera';
import {useColorScheme} from '../../../../theme';
import {useEmitterValue} from "../../../../lib/modules/event-emitter";

export type SearchSheetContentProps = {
  state: SearchState;
};

export const SearchSheetContent: FunctionComponent<
  SearchSheetContentProps
> = props => {
  const {control} = HomeService.useState();

  const {tokens} = useColorScheme();

  const isCameraLocked = useCameraLock(control.cameraService);

  const [searchText, setSearchText] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const onSearchTextChange = (text: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setSearchText(text);
    }, 500);
  };

  const {data: searchResult} = MapboxQueries.useForwardGeocode(searchText);

  const navigation = useNavigation();

  const onSettingsPress = () => {
    navigation.navigate('Settings');
  };

  return (
    <>
      <OverlayPortal position={'top-right'}>
        <Icon shape={'rounded'} size={'md'} onPress={onSettingsPress}>
          <Cog />
        </Icon>

        <Icon
          shape={'rounded'}
          size={'md'}
          variant={isCameraLocked ? 'subtle' : 'default'}
          onPress={() => control.cameraService.toggleCameraLock()}>
          {!isCameraLocked ? (
            <Navigation2Off />
          ) : (
            <Navigation2 fill={'white'} />
          )}
        </Icon>
      </OverlayPortal>

      <MapPortal>
        <Mapbox.Camera ref={control.cameraService.ref} />

        <UserLocationPuck
          onUserLocationUpdate={control.useLocationService.onUserLocationUpdate}
        />

        <Mapbox.ShapeSource
          shape={turf.featureCollection([turf.point([174.7633, -36.8485])])}>
          <Mapbox.CircleLayer id={'circle'} style={{circleRadius: 10}} />
        </Mapbox.ShapeSource>
      </MapPortal>

      <BottomSheetFlatList
        className={'w-full flex-0 min-h-1'}
        onLayout={control.bottomSheetService.onLayout}
        data={searchResult?.features ?? []}
        renderItem={({item}) => {
          return (
            <>
              <Text>{item.id}</Text>
            </>
          );
        }}
        ListHeaderComponent={<Header onSearchTextChange={onSearchTextChange} />}
      />
    </>
  );
};

export type HeaderProps = {
  onSearchTextChange: (text: string) => void;
  isSearching?: boolean;
};
const Header: FunctionComponent<HeaderProps> = props => {
  const {onSearchTextChange, isSearching} = props;

  const {control} = HomeService.useState();

  const toursBottomSheet = useRef<ToursBottomSheet>(null);

  const [isFocused, focusProps] = useFocus({
    onFocus: () => {
        console.log('onFocus');
      control.cameraService.unlockCamera();

      const userLocation = control.useLocationService.getUserLocation();

        if (userLocation) {
            control.cameraService.setCamera({
            centerCoordinate: [userLocation.longitude, userLocation.latitude],
            zoomLevel: 14,
            });
        }

    },
  });

  const [text, onChangeText] = useTextInput({
    onChange: onSearchTextChange,
  });


  const bottomSheetHeight = useEmitterValue(control.bottomSheetService.emitter, "BOTTOM_SHEET_LAYOUT_CHANGED");
  const keyboardState = useEmitterValue(control.keyboardService.emitter, "KEYBOARD_STATE_CHANGED");



    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Clear existing timeout to reset debounce timer
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // Set new timeout
        debounceRef.current = setTimeout(() => {
            const keyboardHeight = keyboardState?.state.isKeyboardShown ? keyboardState?.state?.event?.startCoordinates?.height ?? 0 : 0;
            const sheetHeight = bottomSheetHeight?.newLayout.height ?? 0;

            console.log('keyboardHeight', keyboardHeight);
            console.log('sheetHeight', sheetHeight);

            const totalBottomPadding = sheetHeight + keyboardHeight;

            control.cameraService.setCamera({
                padding: {
                    paddingBottom: totalBottomPadding,
                }
            });
        }, 500); // Adjust the delay as needed

        // Cleanup on unmount
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [keyboardState?.state.isKeyboardShown, keyboardState?.state?.event?.startCoordinates?.height, bottomSheetHeight?.newLayout.height]);

  return (
    <>
      <View className={'w-full p-4 flex-row gap-2'}>
        <View className={'flex-1'}>
          <Input
            {...focusProps}
            onChangeText={onChangeText}
            value={text}
            inBottomSheet
            leftIcon={
              <Icon variant={'none'} size={'sm'} onPress={() => {}}>
                <Search />
              </Icon>
            }
            isLoading={isSearching}
            enableClear
            placeholder={'Search here'}
          />
        </View>
        {!isFocused ? (
          <Icon
            onPress={() => {
              toursBottomSheet.current?.present();
            }}>
            <List />
          </Icon>
        ) : (
          <Icon
            onPress={() => {
              // toursBottomSheet.current?.present();
            }}>
            <ArrowRight />
          </Icon>
        )}
      </View>

      <ToursBottomSheet sheetRef={toursBottomSheet} />
    </>
  );
};
