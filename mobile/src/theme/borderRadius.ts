/**
 * ComplyWise Mobile Design Tokens - Border Radius Scale
 */

export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  round: 9999,
} as const;

export type BorderRadiusToken = keyof typeof borderRadius;
