import type {FunctionComponent, PropsWithChildren} from 'react';
import React from 'react';
import {View} from 'react-native';
import {cva} from 'class-variance-authority';
import {cn, useColorScheme} from '../theme';
import {Loader} from 'lucide-react-native';
import {Icon, IconProps} from './icon.tsx';

export type SpinnerProps = PropsWithChildren<IconProps>;

const spinnerVariants = cva('', {
  variants: {
    size: {
      sm: '',
      md: '',
      lg: '',
    },
    color: {
      primary: '',
    },
  },
  defaultVariants: {
    color: 'primary',
  },
});

export const Spinner: FunctionComponent<SpinnerProps> = props => {
  const {...otherProps} = props;

  const {tokens} = useColorScheme();

  return (
    <Icon variant={'none'} {...otherProps}>
      <View
        className={cn([
          'animate-spin items-center justify-center h-full w-full',
        ])}>
        <Loader
          color={tokens.color.interactive.default.foreground.dark}
          size={'100%'}
        />
      </View>
    </Icon>
  );
};
