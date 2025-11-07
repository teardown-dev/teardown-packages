import React, {FunctionComponent, PropsWithChildren} from 'react';
import {
  BottomSheetCloseIcon,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetModal,
  BottomSheetTitle,
} from '../../../components/bottom-sheet.tsx';
import {View} from 'react-native';
import {BottomSheetModal as GorhomBottomSheetModal} from '@gorhom/bottom-sheet';

export type ToursBottomSheetProps = PropsWithChildren<{
  sheetRef?: React.RefObject<GorhomBottomSheetModal>;
}>;

export type ToursBottomSheet = BottomSheetModal;
export const ToursBottomSheet: FunctionComponent<
  ToursBottomSheetProps
> = props => {
  const {sheetRef} = props;

  return (
    <BottomSheetModal sheetRef={sheetRef}>
      <BottomSheetCloseIcon />

      <BottomSheetHeader>
        <BottomSheetTitle>Tours</BottomSheetTitle>
        <BottomSheetDescription>List of tours available</BottomSheetDescription>
      </BottomSheetHeader>

      <View className={'h-96'} />
    </BottomSheetModal>
  );
};
