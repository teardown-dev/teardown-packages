import type {FunctionComponent, PropsWithChildren} from 'react';
import React from 'react';
import GorhomBottomSheet, {
  BottomSheetModalProps,
  BottomSheetView,
  useBottomSheetSpringConfigs,
} from '@gorhom/bottom-sheet';
import {ReduceMotion, useReducedMotion} from 'react-native-reanimated';

export type BottomSheetProps = PropsWithChildren<BottomSheetModalProps>;

export const BottomSheet: FunctionComponent<BottomSheetProps> = props => {
  const {children, ...otherProps} = props;

  const reduceMotionEnabled = useReducedMotion();
  const overrideConfig = useBottomSheetSpringConfigs({
    damping: 500,
    stiffness: 1000,
    mass: 3,
    overshootClamping: true,
    restDisplacementThreshold: 10,
    restSpeedThreshold: 10,
    reduceMotion: ReduceMotion.Never,
  });

  return (
    <GorhomBottomSheet
      animationConfigs={reduceMotionEnabled ? undefined : overrideConfig}
      enableDynamicSizing={true}
      {...otherProps}>
      <BottomSheetView>{children}</BottomSheetView>
    </GorhomBottomSheet>
  );
};
