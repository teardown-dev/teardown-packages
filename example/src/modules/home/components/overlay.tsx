import type {FunctionComponent, PropsWithChildren} from 'react';
import React from 'react';
import {SafeAreaView, View} from 'react-native';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/card.tsx';
import {CameraLockButton} from '../../../lib/modules/camera';
import {UserLocationButton} from '../../../lib/modules/user-location/components/user-location-button.tsx';
import {useSharedValue} from 'react-native-reanimated';

export type OverlayProps = PropsWithChildren<{}>;

export const Overlay: FunctionComponent<OverlayProps> = props => {
  const {} = props;

  const bottomOffset = useSharedValue(0);

  return (
    <View
      className={
        'absolute top-0 bottom-0 left-0 right-0 pointer-events-box-none'
      }>
      <SafeAreaView className={'flex-1 pointer-events-box-none'}>
        <View className={'flex-1 flex-row pointer-events-box-none'}>
          <View className={'flex-1 pointer-events-box-none p-4 pl-8'}>
            <Card>
              <CardContent>
                <CardHeader>
                  <CardTitle>Asdasdasd</CardTitle>
                </CardHeader>
              </CardContent>
            </Card>
          </View>
        </View>
        <View className={'gap-2 pointer-events-box-none p-4 pr-8'}>
          {/*<CameraLockButton />*/}
          {/*<UserLocationButton />*/}
        </View>
      </SafeAreaView>
    </View>
  );
};
