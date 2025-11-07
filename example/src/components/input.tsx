import {BottomSheetTextInput} from '@gorhom/bottom-sheet';
import React, {
  forwardRef,
  ReactNode,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {Pressable, TextInput, TextInputProps, View} from 'react-native';
import {TextInputFocusEventData} from 'react-native/Libraries/Components/TextInput/TextInput';
import {NativeSyntheticEvent} from 'react-native/Libraries/Types/CoreEventTypes';
import {ShieldClose, XCircle} from 'lucide-react-native';
import {cn} from '../theme/cn.ts';
import {cva, VariantProps} from 'class-variance-authority';
import {useColorScheme} from '../theme';
import {Icon} from './icon.tsx';
import {Spinner} from './spinner.tsx';

export type Input = TextInput;

const inputVariants = cva('text-body-md text-foreground py-5 w-full', {
  variants: {
    variant: {
      default: 'rounded-2xl',
    },
    size: {
      sm: '',
      md: 'h-14',
      lg: '',
      icon: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

export type InputProps = TextInputProps & {
  textStyle?: TextInputProps['style'];
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isLoading?: boolean;
  enableClear?: ReactNode;
  inBottomSheet?: boolean;
} & VariantProps<typeof inputVariants>;

export const Input = forwardRef<TextInput, InputProps>((props, ref) => {
  const {
    variant,
    style,
    leftIcon,
    rightIcon,
    isLoading = false,
    enableClear = false,
    value,
    textStyle,
    onChangeText,
    onFocus,
    onBlur,
    editable = true,
    inBottomSheet,
    ...otherProps
  } = props;
  const Component = inBottomSheet ? BottomSheetTextInput : TextInput;
  const variantClassName = inputVariants({variant});

  const inputRef = useRef<TextInput>(null);
  useImperativeHandle(ref, () => inputRef.current!);

  const hasText = value != null && value.trim() !== '';

  const onClearPress = () => {
    onChangeText?.('');
    inputRef.current?.focus();
  };

  // const clear =
  //   enableClear && hasText ? (
  //
  //   ) : null;

  const clearEnabled = enableClear != null;
  const hasRightIcon = rightIcon != null;
  const showRightContent = clearEnabled || hasRightIcon;

  const {tokens} = useColorScheme();

  const clear = (
    <Icon variant={'none'} size={'sm'} onPress={onClearPress}>
      <XCircle color={tokens.color.foreground.default.dark} />
    </Icon>
  );

  const rightContent = (
    <>
      {isLoading ? (
        <>
          <Spinner size={'sm'} />
        </>
      ) : (
        <>
          {clearEnabled && hasText && clear}
          {hasRightIcon && rightIcon}
        </>
      )}
    </>
  );

  const right = showRightContent ? rightContent : null;

  const hasLeft = leftIcon != null;
  const hasRight = right != null;

  const [focused, setFocused] = useState(false);

  const handleOnFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setFocused(true);
    onFocus?.(e);
  };

  const handleOnBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setFocused(false);
    onBlur?.(e);
  };

  return (
    <View
      className={cn(
        'flex-row bg-interactive-subtle-surface border border-interactive-subtle-surface px-4 rounded-2xl overflow-hidden',
        focused && 'border-interactive-subtle-foreground-hover',
      )}
      style={style}>
      {hasLeft && (
        <View
          className={'absolute left-1 h-full justify-center items-center z-10'}>
          {leftIcon}
        </View>
      )}
      <Component
        // @ts-ignore
        ref={inputRef}
        className={cn([
          hasLeft && 'pl-10',
          hasRight && 'pr-10',
          variantClassName,
        ])}
        style={textStyle}
        placeholderTextColor={'#8C8C8C'}
        onChangeText={onChangeText}
        value={value}
        onFocus={handleOnFocus}
        onBlur={handleOnBlur}
        editable={editable}
        {...otherProps}
      />
      {hasRight && (
        <View
          className={
            'absolute right-0 h-full justify-center items-center z-10 flex-row'
          }>
          {right}
        </View>
      )}
    </View>
  );
});
