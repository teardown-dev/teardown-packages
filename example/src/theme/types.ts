import {colors} from './colorss.ts';

type ColorShades = keyof (typeof colors)['kale'];
type ColorGroupToken<T = string> = Record<ColorShades, T>;
export type FlattenedTokens = Record<string, LightAndDarkToken>;

export interface LightAndDarkToken {
  light: string;
  dark: string;
}

export type SurfaceTokens = {
  'ui-navbar': LightAndDarkToken;
  'ui-background': LightAndDarkToken;
  default: LightAndDarkToken;
  subtle: LightAndDarkToken;
  bright: LightAndDarkToken;
  inverted: LightAndDarkToken;
  dim: LightAndDarkToken;
};

export type ForegroundTokens = {
  'ui-navbar': LightAndDarkToken;
  default: LightAndDarkToken;
  subtle: LightAndDarkToken;
  disabled: LightAndDarkToken;
  inverted: LightAndDarkToken;
};

export type BorderTokens = {
  default: LightAndDarkToken;
  subtle: LightAndDarkToken;
  bold: LightAndDarkToken;
  hover: LightAndDarkToken;
  focus: LightAndDarkToken;
};

export type ActionTokens = {
  primary: {
    foreground: LightAndDarkToken;
    surface: LightAndDarkToken;
    'surface-hover': LightAndDarkToken;
  };
  'primary-alternative': {
    foreground: LightAndDarkToken;
    surface: LightAndDarkToken;
    'surface-hover': LightAndDarkToken;
  };
  tonal: {
    foreground: LightAndDarkToken;
    surface: LightAndDarkToken;
    'surface-hover': LightAndDarkToken;
  };
  secondary: {
    foreground: LightAndDarkToken;
    surface: LightAndDarkToken;
    'surface-hover': LightAndDarkToken;
  };
  outline: {
    foreground: LightAndDarkToken;
    border: LightAndDarkToken;
    'border-hover': LightAndDarkToken;
  };
  destructive: {
    foreground: LightAndDarkToken;
    surface: LightAndDarkToken;
    'surface-hover': LightAndDarkToken;
  };
  'ghost-primary': {
    foreground: LightAndDarkToken;
    'surface-hover': LightAndDarkToken;
  };
  'ghost-secondary': {
    foreground: LightAndDarkToken;
    'surface-hover': LightAndDarkToken;
  };
  'text-primary': {
    foreground: LightAndDarkToken;
  };
};

export type InteractiveTokens = {
  default: {
    foreground: LightAndDarkToken;
    'foreground-hover': LightAndDarkToken;
    surface: LightAndDarkToken;
    'surface-hover': LightAndDarkToken;
    'surface-disabled': LightAndDarkToken;
  };
  subtle: {
    foreground: LightAndDarkToken;
    'foreground-hover': LightAndDarkToken;
    surface: LightAndDarkToken;
    'surface-hover': LightAndDarkToken;
  };
  bold: {
    surface: LightAndDarkToken;
    'surface-hover': LightAndDarkToken;
  };
  accent: {
    'foreground-active': LightAndDarkToken;
    'surface-active': LightAndDarkToken;
    'surface-selected': LightAndDarkToken;
    'surface-inactive': LightAndDarkToken;
    'surface-switcher': LightAndDarkToken;
    'surface-switcher-selected': LightAndDarkToken;
  };
};

export type SemanticTokens = {
  success: {
    'foreground-subtle': LightAndDarkToken;
    'foreground-bold': LightAndDarkToken;
    'surface-subtle': LightAndDarkToken;
    'surface-bold': LightAndDarkToken;
    'surface-dim': LightAndDarkToken;
    border: LightAndDarkToken;
  };
  critical: {
    'foreground-subtle': LightAndDarkToken;
    'foreground-bold': LightAndDarkToken;
    'surface-subtle': LightAndDarkToken;
    'surface-bold': LightAndDarkToken;
    'surface-dim': LightAndDarkToken;
    border: LightAndDarkToken;
  };
  info: {
    'foreground-subtle': LightAndDarkToken;
    'foreground-bold': LightAndDarkToken;
    'surface-subtle': LightAndDarkToken;
    'surface-bold': LightAndDarkToken;
    'surface-dim': LightAndDarkToken;
    border: LightAndDarkToken;
  };
  warning: {
    'foreground-subtle': LightAndDarkToken;
    'foreground-bold': LightAndDarkToken;
    'surface-subtle': LightAndDarkToken;
    'surface-bold': LightAndDarkToken;
    'surface-dim': LightAndDarkToken;
    border: LightAndDarkToken;
  };
  accent: {
    'foreground-subtle': LightAndDarkToken;
    'foreground-bold': LightAndDarkToken;
    'surface-subtle': LightAndDarkToken;
    'surface-bold': LightAndDarkToken;
    'surface-dim': LightAndDarkToken;
    border: LightAndDarkToken;
  };
};

export type BaseTokens = {
  color: {
    white: string;
    black: string;
    neutral: ColorGroupToken & {75: string};
    accent: {
      kale: ColorGroupToken;
      splice: ColorGroupToken;
      sloe: ColorGroupToken;
      burple: ColorGroupToken;
      margarita: ColorGroupToken;
    };
    positive: ColorGroupToken;
    warning: ColorGroupToken;
    critical: ColorGroupToken;
    info: ColorGroupToken;
  };
};

export type Tokens = {
  color: {
    surface: SurfaceTokens;
    foreground: ForegroundTokens;
    border: BorderTokens;
    action: ActionTokens;
    interactive: InteractiveTokens;
    semantic: SemanticTokens;
  };
};
