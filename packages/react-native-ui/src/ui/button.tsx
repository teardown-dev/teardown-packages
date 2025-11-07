import React, {forwardRef, ReactNode} from 'react';
import {cva, VariantProps} from 'class-variance-authority';
import {Pressable, PressableProps, TextProps, View} from 'react-native';
// import {Spinner} from "./spinner";
import {Text} from "./text";

const buttonVariants = cva(
  'rounded border justify-center items-center flex-row gap-2',
  {
    variants: {
      variant: {
        primary:
          'bg-action-primary-surface active:bg-action-primary-surface-hover text-action-primary-foreground',
        'primary-alternative':
          'bg-action-primary-alternative-surface active:bg-action-primary-alternative-surface-hover text-action-primary-alternative-foreground',
        secondary:
          'bg-action-secondary-surface active:bg-action-secondary-surface-hover text-action-secondary-foreground',
        outline:
          'bg-transparent active:bg-action-primary-alternative-surface-hover border-action-outline-border active:border-action-outline-border-hover text-action-outline-foreground',
        tonal:
          'bg-action-tonal-surface active:bg-action-tonal-surface-hover text-action-tonal-foreground',
        destructive:
          'bg-action-destructive-surface active:bg-action-destructive-surface-hover text-action-destructive-foreground',
        'ghost-primary':
          'bg-transparent active:bg-action-ghost-primary-surface-hover text-action-ghost-primary-foreground',
        'ghost-secondary':
          'bg-transparent active:bg-action-ghost-secondary-surface-hover text-action-ghost-secondary-foreground',
        'link-primary': 'bg-transparent text-action-text-primary-foreground',
        'link-secondary':
          'bg-transparent text-action-text-secondary-foreground',
        muted:
          'bg-interactive-subtle-surface active:bg-interactive-subtle-surface-hover text-interactive-default-foreground',
      },
      size: {
        xs: 'px-2 py-1 rounded-md min-h-6',
        sm: 'px-3 py-2 rounded-md min-h-10',
        md: 'px-6 py-3 rounded-lg min-h-14',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

const buttonTextVariants = cva('text-center', {
  variants: {
    variant: {
      primary: 'text-action-primary-foreground',
      'primary-alternative': 'text-action-primary-alternative-foreground',
      secondary: 'text-action-secondary-foreground',
      outline: 'text-action-outline-foreground',
      tonal: 'text-action-tonal-foreground',
      destructive: 'text-action-destructive-foreground',
      'ghost-primary': 'text-action-ghost-primary-foreground',
      'ghost-secondary': 'text-action-ghost-secondary-foreground',
      'link-primary': 'text-action-text-primary-foreground',
      'link-secondary': 'text-action-text-secondary-foreground',
      muted: 'text-action-outline-foreground',
    },
    size: {
      xs: 'text-label-xs',
      sm: 'text-label-sm',
      md: 'text-label-md',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

export interface ButtonProps
  extends PressableProps,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  startAdornmentComponent?: ReactNode;
  endAdornmentComponent?: ReactNode;
}

export const Button = forwardRef<View, ButtonProps>((props, ref) => {
  const {
    style,
    disabled = false,
    isLoading = false,
    children,
    size = 'md',
    variant = 'primary',
    startAdornmentComponent,
    endAdornmentComponent,
    ...otherProps
  } = props;

  const isChildrenString = typeof children === 'string';

  const buttonClasses = buttonVariants({variant, size});

  console.log('buttonClasses', buttonClasses);

  return (
    <Pressable
      ref={ref}
      {...otherProps}
      disabled={disabled || isLoading}
      className={`${buttonClasses} ${disabled ? 'opacity-60' : ''}`}
      style={style}>
      {isLoading ? (
        <View
          className={`items-center justify-center overflow-hidden ${
            size === 'xs' ? 'h-4.5' : size === 'sm' ? 'h-4.5' : 'h-6'
          }`}>
          {/*<Spinner TODO fix */}
          {/*  variant={*/}
          {/*    variant === 'primary' || variant === 'primary-alternative'*/}
          {/*      ? 'dark'*/}
          {/*      : 'splice'*/}
          {/*  }*/}
          {/*  size={size}*/}
          {/*/>*/}
        </View>
      ) : (
        <>
          {startAdornmentComponent && (
            <View className="absolute h-full pl-4 justify-center items-center content-center left-0">
              {startAdornmentComponent}
            </View>
          )}
          {isChildrenString ? (
            <ButtonText variant={variant} size={size}>
              {children}
            </ButtonText>
          ) : (
            children
          )}
          {endAdornmentComponent && (
            <View className="absolute h-full pr-4 justify-center items-center content-center right-0">
              {endAdornmentComponent}
            </View>
          )}
        </>
      )}
    </Pressable>
  );
});

export const ButtonText: React.FunctionComponent<
  TextProps & VariantProps<typeof buttonTextVariants>
> = ({size, variant, style, children, ...props}) => {
  const textClasses = buttonTextVariants({variant, size});

  return (
    <Text {...props} className={textClasses} style={style}>
      {children}
    </Text>
  );
};
