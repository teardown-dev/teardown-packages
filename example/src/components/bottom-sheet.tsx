import type {FunctionComponent, PropsWithChildren} from 'react';
import React from 'react';
import GorhomBottomSheet, {
  BottomSheetModalProps,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import {useColorScheme} from '../theme';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

export type BottomSheetProps = PropsWithChildren<BottomSheetModalProps> & {
  sheetRef?: React.RefObject<GorhomBottomSheet>;
};

export type BottomSheet = GorhomBottomSheet;
export const BottomSheet: FunctionComponent<BottomSheetProps> = props => {
  const {children, sheetRef, ...otherProps} = props;

  const {tokens} = useColorScheme();

  const safeArea = useSafeAreaInsets();

  return (
    <GorhomBottomSheet
      ref={sheetRef}
      enableDynamicSizing
      enablePanDownToClose={false}
      keyboardBehavior="interactive"
      keyboardBlurBehavior={'restore'}
      animateOnMount={false}
      handleIndicatorStyle={{
        backgroundColor: tokens.color.foreground.default.dark,
        width: 64,
      }}
      backgroundStyle={{
        backgroundColor: tokens.color.surface.default.dark,
      }}
      {...otherProps}>
      <BottomSheetView
        className={'w-full min-h-1'}
        style={{
          paddingBottom: safeArea.bottom,
        }}>
        {children}
      </BottomSheetView>
    </GorhomBottomSheet>
  );
};
