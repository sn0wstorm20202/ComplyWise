/**
 * ComplyWise Mobile Design System - Unified Theme Export
 */

import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { borderRadius } from './borderRadius';

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  layout: {
    screenPadding: spacing.lg,
    cardPadding: spacing.md,
    maxContentWidth: 480,
  },
} as const;

export type Theme = typeof theme;

export { colors } from './colors';
export { typography } from './typography';
export { spacing } from './spacing';
export { borderRadius } from './borderRadius';

export default theme;
