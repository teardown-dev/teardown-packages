import type {FunctionComponent, PropsWithChildren} from 'react';
import React from 'react';
import {SafeAreaView, View} from 'react-native';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/card.tsx';
import {Portal, PortalHost} from '@gorhom/portal';
import {HomeService} from '../services/home.service.ts';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

export type OverlayProps = PropsWithChildren<{}>;

export const Overlay: FunctionComponent<OverlayProps> = props => {
  const {} = props;

  const layout = HomeService.useBottomSheetLayout();

  return (
    <View
      className={
        'absolute top-0 bottom-0 left-0 right-0 pointer-events-box-none'
      }>
      <SafeAreaView className={'pointer-events-box-none flex-1 flex-row'}>
        <View
          className={'flex-1 pointer-events-box-none'}
          style={{
            paddingBottom: layout?.height,
          }}>
          <View className={'pointer-events-box-none gap-4 p-6'}>
            <PortalHost name={'overlay-top-left'} />
          </View>

          <View className={'pointer-events-box-none flex-1 gap-4 p-6'}>
            <PortalHost name={'overlay-content'} />
          </View>

          <View className={'pointer-events-box-none gap-4 p-6'}>
            <PortalHost name={'overlay-bottom-left'} />
          </View>
        </View>
        <View className={'pointer-events-box-none gap-4 p-6'}>
          <PortalHost name={'overlay-top-right'} />
        </View>
      </SafeAreaView>
    </View>
  );
};

const Banner = () => {
  return (
    <Card key={'banner'}>
      <CardContent>
        <CardHeader>
          <CardTitle>Asdasdasd</CardTitle>
        </CardHeader>
      </CardContent>
    </Card>
  );
};

export type OverlayPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export type OverlayPortalProps = PropsWithChildren<{
  position: OverlayPosition;
}>;
export const OverlayPortal: FunctionComponent<OverlayPortalProps> = props => {
  const {position, children} = props;
  return (
    <Portal key={`overlay-${position}`} hostName={`overlay-${position}`}>
      {children}
    </Portal>
  );
};
