import {FunctionComponent, PropsWithChildren, useMemo} from 'react';
import React from 'react';
import {Keyboard} from 'react-native';
import {BottomSheet} from '../../../components/bottom-sheet.tsx';
import {SearchSheetContent} from './content/search.sheet-content.tsx';
import {HomeService} from '../services/home.service.ts';
import {RouteBuilderSheetContent} from './content/route-builder.sheet-content.tsx';

export type HomeSheetProps = PropsWithChildren<{
  sheetRef?: React.RefObject<BottomSheet>;
}>;

export const HomeSheet: FunctionComponent<HomeSheetProps> = props => {
  const {sheetRef} = props;

  const [index, setIndex] = React.useState(0);

  const onChange = (index: number) => {
    setIndex(index);

    console.log('index', index);

    if (index === 0) {
      Keyboard.dismiss();
    }
  };

  const state = HomeService.useCurrentState();

  const sheetContent = useMemo(() => {
    switch (state.type) {
      case 'ROUTE_BUILDER':
        return <RouteBuilderSheetContent state={state} />;
      case 'SEARCH':
        return <SearchSheetContent state={state} />;
      case 'NAVIGATION':
        break;
    }
  }, [state.type]);

  return (
    <BottomSheet
      sheetRef={sheetRef}
      // enableContentPanningGesture={false}
      index={index}
      onChange={onChange}
      keyboardBehavior={'interactive'}
      // keyboardBlurBehavior={'restore'}
      // snapPoints={['70%']}
      // enableDynamicSizing={false}
      enablePanDownToClose={false}>
      {sheetContent}
    </BottomSheet>
  );
};
