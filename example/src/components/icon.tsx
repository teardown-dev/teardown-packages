import type {FunctionComponent, PropsWithChildren} from 'react';
import React from 'react';
import {cva, type VariantProps} from 'class-variance-authority';
import {Interactive, InteractiveProps} from './interactive.tsx';
import {cn} from '../theme';
import {View} from 'react-native';

const iconVariants = cva('items-center justify-center', {
  variants: {
    variant: {
      none: '',
      default: '',
      subtle: '',
      accent: '',
    },
    shape: {
      rounded: 'rounded-full',
      square: 'rounded-2xl',
    },
    size: {
      xs: 'h-8 w-8 rounded-xl',
      sm: 'h-11 w-11',
      md: 'h-14 w-14',
    },
  },
  defaultVariants: {
    variant: 'default',
    shape: 'square',
    size: 'md',
  },
});

const iconSizeVariants = cva('', {
  variants: {
    size: {
      xs: 'h-4 w-4',
      sm: 'h-5 w-5',
      md: 'h-7 w-7',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export type IconProps = PropsWithChildren<InteractiveProps> &
  VariantProps<typeof iconVariants> &
  VariantProps<typeof iconSizeVariants>;
export const Icon: FunctionComponent<IconProps> = props => {
  const {className, variant, shape, size = 'md', ...otherProps} = props;

  const child = React.Children.map(props.children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        size: '100%',
        ...child.props,
        color: 'white',
      });
    }
    return child;
  });

  const iconVariantClassName = iconVariants({variant, shape, size});
  const iconSizeVariantClassName = iconSizeVariants({size});

  return (
    <Interactive
      {...otherProps}
      variant={variant}
      className={cn(
        // 'h-full aspect-square bg-interactive-subtle-surface rounded-2xl justify-center items-center p-4',
        iconVariantClassName,
        className,
      )}>
      <View
        className={cn([
          'items-center justify-center',
          iconSizeVariantClassName,
        ])}>
        {child}
      </View>
    </Interactive>
  );
};
