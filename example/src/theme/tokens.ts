import {colors} from './colors';
import {BaseTokens, Tokens} from './types';

export const baseTokens: BaseTokens = {
  color: {
    white: colors.white,
    black: colors.black,
    neutral: colors.neutral,
    accent: {
      burple: colors.burple,
      margarita: colors.margarita,
      kale: colors.kale,
      splice: colors.splice,
      sloe: colors.sloe,
    },
    positive: colors.positive,
    warning: colors.aioli,
    critical: colors.chilli,
    info: colors.info,
  },
};

export const tokens: Tokens = {
  color: {
    surface: {
      'ui-navbar': {
        light: baseTokens.color.black,
        dark: baseTokens.color.black,
      },
      'ui-background': {
        light: baseTokens.color.white,
        dark: baseTokens.color.black,
      },
      default: {
        light: baseTokens.color.white,
        dark: baseTokens.color.neutral[800],
      },
      subtle: {
        light: baseTokens.color.neutral[50],
        dark: baseTokens.color.neutral[900],
      },
      bright: {
        light: baseTokens.color.neutral[75],
        dark: baseTokens.color.neutral[700],
      },
      inverted: {
        light: baseTokens.color.neutral[900],
        dark: baseTokens.color.neutral[50],
      },
      dim: {
        light: baseTokens.color.neutral[50],
        dark: baseTokens.color.black,
      },
    },
    foreground: {
      'ui-navbar': {
        light: baseTokens.color.white,
        dark: baseTokens.color.white,
      },
      default: {
        light: baseTokens.color.neutral[900],
        dark: baseTokens.color.white,
      },
      subtle: {
        light: baseTokens.color.neutral[700],
        dark: baseTokens.color.neutral[100],
      },
      disabled: {
        light: baseTokens.color.neutral[600],
        dark: baseTokens.color.neutral[300],
      },
      inverted: {
        light: baseTokens.color.white,
        dark: baseTokens.color.neutral[900],
      },
    },
    border: {
      default: {
        light: baseTokens.color.neutral[100],
        dark: baseTokens.color.neutral[700],
      },
      subtle: {
        light: baseTokens.color.neutral[50],
        dark: baseTokens.color.neutral[800],
      },
      bold: {
        light: baseTokens.color.neutral[200],
        dark: baseTokens.color.neutral[600],
      },
      hover: {
        light: baseTokens.color.neutral[800],
        dark: baseTokens.color.neutral[75],
      },
      focus: {
        light: baseTokens.color.accent.kale[800],
        dark: baseTokens.color.accent.splice[300],
      },
    },
    interactive: {
      default: {
        foreground: {
          light: baseTokens.color.neutral[800],
          dark: baseTokens.color.neutral[100],
        },
        'foreground-hover': {
          light: baseTokens.color.neutral[900],
          dark: baseTokens.color.neutral[75],
        },
        surface: {
          light: baseTokens.color.neutral[75],
          dark: baseTokens.color.neutral[700],
        },
        'surface-hover': {
          light: baseTokens.color.neutral[100],
          dark: baseTokens.color.neutral[600],
        },
        'surface-disabled': {
          light: baseTokens.color.neutral[300],
          dark: baseTokens.color.neutral[500],
        },
      },
      subtle: {
        foreground: {
          light: baseTokens.color.neutral[600],
          dark: baseTokens.color.neutral[300],
        },
        'foreground-hover': {
          light: baseTokens.color.neutral[800],
          dark: baseTokens.color.neutral[200],
        },
        surface: {
          light: baseTokens.color.white,
          dark: baseTokens.color.neutral[900],
        },
        'surface-hover': {
          light: baseTokens.color.neutral[50],
          dark: baseTokens.color.neutral[800],
        },
      },
      bold: {
        surface: {
          light: baseTokens.color.neutral[800],
          dark: baseTokens.color.white,
        },
        'surface-hover': {
          light: baseTokens.color.neutral[700],
          dark: baseTokens.color.neutral[75],
        },
      },
      accent: {
        'foreground-active': {
          light: baseTokens.color.accent.kale[800],
          dark: baseTokens.color.accent.splice[300],
        },
        'surface-active': {
          light: baseTokens.color.accent.kale[600],
          dark: baseTokens.color.accent.splice[300],
        },
        'surface-selected': {
          light: baseTokens.color.accent.kale[100],
          dark: baseTokens.color.accent.splice[950],
        },
        'surface-inactive': {
          light: baseTokens.color.neutral[400],
          dark: baseTokens.color.neutral[600],
        },
        'surface-switcher': {
          light: baseTokens.color.white,
          dark: baseTokens.color.white,
        },
        'surface-switcher-selected': {
          light: baseTokens.color.accent.kale[600],
          dark: baseTokens.color.accent.splice[600],
        },
      },
    },
    semantic: {
      success: {
        'surface-bold': {
          light: baseTokens.color.positive[500],
          dark: baseTokens.color.positive[600],
        },
        'foreground-subtle': {
          light: baseTokens.color.positive[700],
          dark: baseTokens.color.positive[50],
        },
        'surface-subtle': {
          light: baseTokens.color.positive[50],
          dark: baseTokens.color.accent.splice[900],
        },
        'foreground-bold': {
          light: baseTokens.color.positive[500],
          dark: baseTokens.color.positive[400],
        },
        'surface-dim': {
          light: baseTokens.color.positive[300],
          dark: baseTokens.color.accent.splice[300],
        },
        border: {
          light: baseTokens.color.positive[300],
          dark: baseTokens.color.accent.splice[300],
        },
      },
      critical: {
        'surface-bold': {
          light: baseTokens.color.critical[600],
          dark: baseTokens.color.critical[700],
        },
        'foreground-subtle': {
          light: baseTokens.color.critical[900],
          dark: baseTokens.color.critical[100],
        },
        'surface-subtle': {
          light: baseTokens.color.critical[50],
          dark: baseTokens.color.critical[900],
        },
        'foreground-bold': {
          light: baseTokens.color.critical[500],
          dark: baseTokens.color.critical[300],
        },
        'surface-dim': {
          light: baseTokens.color.critical[300],
          dark: baseTokens.color.critical[700],
        },
        border: {
          light: baseTokens.color.critical[600],
          dark: baseTokens.color.critical[400],
        },
      },
      warning: {
        'surface-bold': {
          light: baseTokens.color.warning[600],
          dark: baseTokens.color.warning[700],
        },
        'foreground-subtle': {
          light: baseTokens.color.warning[800],
          dark: baseTokens.color.warning[50],
        },
        'surface-subtle': {
          light: baseTokens.color.warning[50],
          dark: baseTokens.color.warning[900],
        },
        'foreground-bold': {
          light: baseTokens.color.warning[700],
          dark: baseTokens.color.warning[300],
        },
        'surface-dim': {
          light: baseTokens.color.warning[300],
          dark: baseTokens.color.warning[600],
        },
        border: {
          light: baseTokens.color.warning[700],
          dark: baseTokens.color.warning[500],
        },
      },
      info: {
        'surface-bold': {
          light: baseTokens.color.info[600],
          dark: baseTokens.color.info[700],
        },
        'foreground-subtle': {
          light: baseTokens.color.info[900],
          dark: baseTokens.color.info[50],
        },
        'surface-subtle': {
          light: baseTokens.color.info[50],
          dark: baseTokens.color.info[900],
        },
        'foreground-bold': {
          light: baseTokens.color.info[600],
          dark: baseTokens.color.info[300],
        },
        'surface-dim': {
          light: baseTokens.color.info[400],
          dark: baseTokens.color.info[600],
        },
        border: {
          light: baseTokens.color.info[700],
          dark: baseTokens.color.info[600],
        },
      },
      accent: {
        'foreground-subtle': {
          light: baseTokens.color.accent.kale[800],
          dark: baseTokens.color.accent.splice[50],
        },
        'surface-subtle': {
          light: baseTokens.color.accent.kale[50],
          dark: baseTokens.color.accent.splice[900],
        },
        'foreground-bold': {
          light: baseTokens.color.accent.kale[600],
          dark: baseTokens.color.accent.splice[200],
        },
        'surface-bold': {
          light: baseTokens.color.accent.kale[700],
          dark: baseTokens.color.accent.splice[400],
        },
        'surface-dim': {
          light: baseTokens.color.accent.kale[400],
          dark: baseTokens.color.accent.splice[200],
        },
        border: {
          light: baseTokens.color.accent.kale[500],
          dark: baseTokens.color.accent.splice[600],
        },
      },
    },
    action: {
      primary: {
        foreground: {
          light: baseTokens.color.white,
          dark: baseTokens.color.black,
        },
        surface: {
          light: baseTokens.color.accent.kale[800],
          dark: baseTokens.color.accent.splice[300],
        },
        'surface-hover': {
          light: baseTokens.color.accent.kale[900],
          dark: baseTokens.color.accent.splice[400],
        },
      },
      'primary-alternative': {
        foreground: {
          light: baseTokens.color.white,
          dark: baseTokens.color.black,
        },
        surface: {
          light: baseTokens.color.neutral[800],
          dark: baseTokens.color.white,
        },
        'surface-hover': {
          light: baseTokens.color.neutral[700],
          dark: baseTokens.color.neutral[100],
        },
      },
      tonal: {
        foreground: {
          light: baseTokens.color.accent.kale[800],
          dark: baseTokens.color.accent.splice[300],
        },
        surface: {
          light: baseTokens.color.accent.kale[100],
          dark: baseTokens.color.accent.splice[950],
        },
        'surface-hover': {
          light: baseTokens.color.accent.kale[200],
          dark: baseTokens.color.accent.splice[900],
        },
      },
      secondary: {
        foreground: {
          light: baseTokens.color.neutral[900],
          dark: baseTokens.color.white,
        },
        surface: {
          light: baseTokens.color.neutral[75],
          dark: baseTokens.color.neutral[700],
        },
        'surface-hover': {
          light: baseTokens.color.neutral[100],
          dark: baseTokens.color.neutral[600],
        },
      },
      outline: {
        foreground: {
          light: baseTokens.color.neutral[900],
          dark: baseTokens.color.white,
        },
        border: {
          light: baseTokens.color.neutral[100],
          dark: baseTokens.color.neutral[700],
        },
        'border-hover': {
          light: baseTokens.color.neutral[900],
          dark: baseTokens.color.white,
        },
      },
      destructive: {
        foreground: {
          light: baseTokens.color.critical[700],
          dark: baseTokens.color.critical[200],
        },
        surface: {
          light: baseTokens.color.critical[100],
          dark: baseTokens.color.critical[950],
        },
        'surface-hover': {
          light: baseTokens.color.critical[200],
          dark: baseTokens.color.critical[900],
        },
      },
      'ghost-primary': {
        foreground: {
          light: baseTokens.color.accent.kale[800],
          dark: baseTokens.color.accent.splice[300],
        },
        'surface-hover': {
          light: baseTokens.color.accent.kale[100],
          dark: baseTokens.color.accent.splice[950],
        },
      },
      'ghost-secondary': {
        foreground: {
          light: baseTokens.color.neutral[900],
          dark: baseTokens.color.white,
        },
        'surface-hover': {
          light: baseTokens.color.neutral[75],
          dark: baseTokens.color.neutral[800],
        },
      },
      'text-primary': {
        foreground: {
          light: baseTokens.color.accent.kale[800],
          dark: baseTokens.color.accent.splice[300],
        },
      },
    },
  },
};
