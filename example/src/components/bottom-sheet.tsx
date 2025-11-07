import {FunctionComponent, PropsWithChildren, useImperativeHandle} from 'react';
import React from 'react';
import GorhomBottomSheet, {
  BottomSheetProps as GorhomBottomSheetProps,
  BottomSheetModalProps as GorhomBottomSheetModalProps,
  BottomSheetView,
  BottomSheetModal as GorhomBottomSheetModal,
} from '@gorhom/bottom-sheet';
import {cn, useColorScheme} from '../theme';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {X} from 'lucide-react-native';
import {Icon} from './icon';
import {Text, TextProps, View, ViewProps} from 'react-native';

export type BottomSheet = GorhomBottomSheet;

export type BottomSheetProps = PropsWithChildren<GorhomBottomSheetProps> & {
  sheetRef?: React.RefObject<BottomSheet>;
};

export const BottomSheet: FunctionComponent<BottomSheetProps> = props => {
  const {children, sheetRef, ...otherProps} = props;

  const {tokens} = useColorScheme();

  const safeArea = useSafeAreaInsets();

  return (
    <GorhomBottomSheet
      ref={sheetRef}
      enableDynamicSizing
      keyboardBehavior="interactive"
      keyboardBlurBehavior={'restore'}
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
export type BottomSheetModal = GorhomBottomSheetModal;

export type BottomSheetModalProps =
  PropsWithChildren<GorhomBottomSheetModalProps> & {
    sheetRef?: React.RefObject<BottomSheetModal>;
  };

export const useModalRef = () => {
  return React.useRef<BottomSheetModal>(null);
};

export const BottomSheetModal: FunctionComponent<
  BottomSheetModalProps
> = props => {
  const {children, sheetRef, ...otherProps} = props;

  const {tokens} = useColorScheme();

  const safeArea = useSafeAreaInsets();

  const ref = React.useRef<BottomSheetModal>(null);

  useImperativeHandle(sheetRef, () => ref.current!);

  return (
    <GorhomBottomSheetModal
      ref={ref}
      enableDynamicSizing
      keyboardBehavior="interactive"
      keyboardBlurBehavior={'restore'}
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
    </GorhomBottomSheetModal>
  );
};

export const BottomSheetCloseIcon: FunctionComponent = () => {
  return (
    <Icon className={'absolute top-0 right-4'}>
      <X />
    </Icon>
  );
};

export const BottomSheetHeader = ({className, ...props}: ViewProps) => (
  <View
    className={cn(
      'flex flex-col space-y-2 text-center sm:text-left py-4 px-6',
      className,
    )}
    {...props}
  />
);
BottomSheetHeader.displayName = 'BottomSheetHeader';

export const BottomSheetTitle: FunctionComponent<TextProps> = ({
  className,
  ...props
}) => (
  <Text
    className={cn('text-lg font-semibold text-foreground', className)}
    {...props}
  />
);
BottomSheetTitle.displayName = 'BottomSheetTitle';

export const BottomSheetDescription: FunctionComponent<TextProps> = ({
  className,
  ...props
}) => (
  <Text className={cn('text-muted-foreground text-md', className)} {...props} />
);
BottomSheetDescription.displayName = 'BottomSheetDescription';
