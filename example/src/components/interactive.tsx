import type {FunctionComponent, PropsWithChildren} from 'react';
import React from 'react';
import {Pressable, PressableProps} from 'react-native';
import {cva, type VariantProps} from 'class-variance-authority';
import {cn} from '../theme';

const interactiveVariants = cva('', {
  variants: {
    variant: {
      default:
        'bg-interactive-default-surface active:bg-interactive-default-surface-hover',
      subtle:
        'bg-interactive-subtle-surface active:bg-interactive-subtle-surface-hover',
      selected:
        'bg-interactive-selected-surface active:bg-interactive-selected-surface-hover',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export type InteractiveProps = PropsWithChildren<PressableProps> &
  VariantProps<typeof interactiveVariants>;

export const Interactive: FunctionComponent<InteractiveProps> = props => {
  const {className, children, variant, ...otherProps} = props;

  const interactiveVariantClassName = interactiveVariants({variant});

  return (
    <Pressable
      {...otherProps}
      className={cn([interactiveVariantClassName, className])}>
      {children}
    </Pressable>
  );
};
