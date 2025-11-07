import type {FunctionComponent, PropsWithChildren} from 'react';
import React from 'react';
import {RouteBuilderState} from '../../services/state.service.ts';
import {
  BottomSheetCloseIcon,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetView,
} from '../../../../components/bottom-sheet.tsx';
import {HomeService} from '../../services/home.service.ts';
import {Card} from '../../../../components/card.tsx';
import {Text} from '../../../../components/text.tsx';
import {View} from 'react-native';
import {MapPin, Pin} from 'lucide-react-native';
import {Icon} from '../../../../components/icon.tsx';

export type RouteBuilderSheetContentProps = PropsWithChildren<{
  state: RouteBuilderState;
}>;

export const RouteBuilderSheetContent: FunctionComponent<
  RouteBuilderSheetContentProps
> = props => {
  const {} = props;

  const {control} = HomeService.useState();

  return (
    <>
      {/*<OverlayPortal position={'top-left'}>*/}
      {/*  <BackFab />*/}
      {/*</OverlayPortal>*/}

      <BottomSheetCloseIcon
        onPress={() => {
          control.stateService.goBack();
        }}
      />
      <BottomSheetView>
        <BottomSheetHeader>
          <BottomSheetTitle>Directions</BottomSheetTitle>
        </BottomSheetHeader>

        <BottomSheetContent>
          <Card>
            <View className={'w-full p-4 pb-0'}>
              <View className={'items-center flex-row gap-3'}>
                <Icon size={'md'}>
                  <MapPin />
                </Icon>
                <View>
                  <Text className={'text-foreground text-md font-bold'}>
                    My location
                  </Text>
                  <Text className={'text-foreground text-sm font-normal'}>
                    31 Orchard Lane
                  </Text>
                </View>
              </View>
            </View>
            {/*<View className={'w-full p-4 flex-row items-center gap-3'}>*/}
            {/*  <Icon size={'sm'}>*/}
            {/*    <MapPin />*/}
            {/*  </Icon>*/}
            {/*  <Text className={'text-foreground text-lg font-semibold'}>*/}
            {/*    My location*/}
            {/*  </Text>*/}
            {/*</View>*/}
          </Card>
        </BottomSheetContent>
      </BottomSheetView>
    </>
  );
};
