import * as React from 'react';

import {TextProps, View, ViewProps} from 'react-native';
import {Text} from './text';
import {cn} from '../theme';
import {FunctionComponent} from 'react';

const Card = React.forwardRef<View, ViewProps>(({className, ...props}, ref) => (
  <View
    ref={ref}
    className={cn(
      'rounded-2xl bg-surface-subtle text-card-foreground ',
      className,
    )}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<View, ViewProps>(
  ({className, ...props}, ref) => (
    <View
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  ),
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<Text, TextProps>(
  ({className, ...props}, ref) => (
    <Text
      // ref={ref}
      className={cn('font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  ),
);
CardTitle.displayName = 'CardTitle';

const CardDescription: FunctionComponent<TextProps> = ({
  className,
  ...props
}) => (
  <Text className={cn('text-sm text-muted-foreground', className)} {...props} />
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<View, ViewProps>(
  ({className, ...props}, ref) => (
    <View ref={ref} className={cn('p-4 pt-0', className)} {...props} />
  ),
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<View, ViewProps>(
  ({className, ...props}, ref) => (
    <View
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  ),
);
CardFooter.displayName = 'CardFooter';

export {Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent};
