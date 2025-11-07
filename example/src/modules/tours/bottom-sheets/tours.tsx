import React, {FunctionComponent, PropsWithChildren} from 'react';
import {
  BottomSheetCloseIcon,
  BottomSheetDescription,
  BottomSheetFlatList,
  BottomSheetHeader,
  BottomSheetModal,
  BottomSheetTitle,
} from '../../../components/bottom-sheet.tsx';
import {
  BottomSheetBackdrop,
  BottomSheetModal as GorhomBottomSheetModal,
} from '@gorhom/bottom-sheet';
import {TourQueries} from '../queries/tour.queries.ts';

export type ToursBottomSheetProps = PropsWithChildren<{
  sheetRef?: React.RefObject<GorhomBottomSheetModal>;
}>;

export type ToursBottomSheet = BottomSheetModal;
export const ToursBottomSheet: FunctionComponent<
  ToursBottomSheetProps
> = props => {
  const {sheetRef} = props;

  const {data: tours} = TourQueries.useTours();

  return (
    <BottomSheetModal
      sheetRef={sheetRef}
      backdropComponent={backdropComponentProps => (
        <BottomSheetBackdrop
          {...backdropComponentProps}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      )}
      stackBehavior={'push'}>
      <BottomSheetCloseIcon />
      <BottomSheetFlatList
        className={'w-full flex-0 min-h-1'}
        data={tours}
        ListHeaderComponent={() => (
          <BottomSheetHeader>
            <BottomSheetTitle>Tours</BottomSheetTitle>
            <BottomSheetDescription>
              List of tours available
            </BottomSheetDescription>
          </BottomSheetHeader>
        )}
        renderItem={() => {
          return <></>;
        }}
      />
    </BottomSheetModal>
  );
};
