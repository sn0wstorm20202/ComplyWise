/**
 * ComplyWise Mobile Design Tokens - Typography Scale
 */

import { TextStyle } from 'react-native';

export const typography = {
  // Font Sizes
  sizes: {
    xxs: 10,
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    display: 30,
  },

  // Line Heights
  lineHeights: {
    tight: 16,
    normal: 20,
    relaxed: 24,
    loose: 28,
    display: 36,
  },

  // Font Weights
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  } as Record<string, TextStyle['fontWeight']>,
} as const;
