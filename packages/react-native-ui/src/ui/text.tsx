import {cn} from '../theme/cn';
import {VariantProps, cva} from 'class-variance-authority';
import * as React from 'react';
import {Text as RNText} from 'react-native';

const textVariants = cva('text-foreground', {
  variants: {
    variant: {
      label: 'text-[12px] leading-5',
      body: 'text-base leading-5',
      subtitle: 'text-sm leading-4',
      caption: 'text-xs leading-3',
      h1: 'text-2xl leading-8',
      h2: 'text-xl leading-7',
      h3: 'text-lg leading-6',
      h4: 'text-base leading-5',
    },
    color: {},
    size: {
      sm: 'text-md',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
    },
  },
  defaultVariants: {},
});

const TextClassContext = React.createContext<string | undefined>(undefined);

function Text({
  className,
  variant,
  color,
  ...props
}: React.ComponentPropsWithoutRef<typeof RNText> &
  VariantProps<typeof textVariants>) {
  const textClassName = React.useContext(TextClassContext);
  return (
    <RNText
      className={cn(textVariants({variant, color}), textClassName, className)}
      {...props}
    />
  );
}

export {Text, TextClassContext, textVariants};
