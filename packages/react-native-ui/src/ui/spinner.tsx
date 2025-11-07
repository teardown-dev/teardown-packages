import {FunctionComponent} from 'react';
import {View} from 'react-native';
import {cva, type VariantProps} from 'class-variance-authority';
import {cn, useColorScheme} from '../theme';
import {Loader} from 'lucide-react-native';
import {Icon, IconProps} from './icon';

const spinnerVariants = cva('animate-spin items-center justify-center', {
  variants: {
    size: {
      xs: 'h-4 w-4',
      sm: 'h-5 w-5',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
    },
    variant: {
      primary: 'text-action-primary-foreground',
      secondary: 'text-action-secondary-foreground',
      dark: 'text-foreground-default',
      splice: 'text-interactive-default-foreground',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'primary',
  },
});

export type SpinnerProps = Omit<IconProps, 'variant'> &
  VariantProps<typeof spinnerVariants>;

export const Spinner: FunctionComponent<SpinnerProps> = ({
  size,
  variant,
  className,
  ...otherProps
}) => {
  const {tokens} = useColorScheme();

  const spinnerClasses = spinnerVariants({size, variant});

  const getColor = () => {
    switch (variant) {
      case 'primary':
        return tokens.color.action.primary.foreground.dark;
      case 'secondary':
        return tokens.color.action.secondary.foreground.dark;
      case 'dark':
        return tokens.color.foreground.default.dark;
      case 'splice':
        return tokens.color.interactive.default.foreground.dark;
      default:
        return tokens.color.action.primary.foreground.dark;
    }
  };

  return (
    <Icon variant="none" {...otherProps}>
      <View className={cn(spinnerClasses, className)}>
        <Loader color={getColor()} size="100%" />
      </View>
    </Icon>
  );
};
