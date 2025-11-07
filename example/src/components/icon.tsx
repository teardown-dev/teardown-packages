import type {FunctionComponent, PropsWithChildren} from 'react';
import React from 'react';
import {cva, type VariantProps} from 'class-variance-authority';
import {Interactive, InteractiveProps} from './interactive.tsx';
import {cn} from '../theme';

const iconVariants = cva('', {
  variants: {
    type: {
      default: 'p-4 rounded-2xl',
    },
    size: {
      sm: '',
      md: 'h-14 w-14',
      lg: '',
      icon: '',
    },
  },
  defaultVariants: {
    type: 'default',
    size: 'md',
  },
});

export type IconProps = PropsWithChildren<InteractiveProps> &
  VariantProps<typeof iconVariants>;
export const Icon: FunctionComponent<IconProps> = props => {
  const {className, type, ...otherProps} = props;

  const child = React.Children.map(props.children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        size: '100%',
        color: 'white',
        ...child.props,
      });
    }
    return child;
  });

  const iconVariantClassName = iconVariants({type});

  return (
    <Interactive
      {...otherProps}
      className={cn(
        // 'h-full aspect-square bg-interactive-subtle-surface rounded-2xl justify-center items-center p-4',
        iconVariantClassName,
        className,
      )}>
      {child}
    </Interactive>
  );
};
