import React, {FunctionComponent, useRef, useState} from 'react';
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
import {useTextInputFocus} from '../../../../hooks/use-text-input-focus.ts';
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
        <Icon shape={'rounded'} size={'sm'} onPress={onSettingsPress}>
          <Cog />
        </Icon>

        <Icon
          shape={'rounded'}
          size={'sm'}
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

  const toursBottomSheet = useRef<ToursBottomSheet>(null);

  const [isFocused, focusProps] = useTextInputFocus();

  const [text, onChangeText] = useTextInput({
    onChange: onSearchTextChange,
  });

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
