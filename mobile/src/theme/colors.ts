/**
 * ComplyWise Mobile Design Tokens - Color Palette
 *
 * Executive Light Theme with UI/UX Layout & Component Architecture
 * directly adapted from Figma `ui layers/` and `UI/`.
 *
 * Primary Canvas: Clean Executive Light Slate (#F8FAFC)
 * Surface / Cards: Pure Crisp White (#FFFFFF)
 * Subtle Surface: Soft Gray Tint (#F1F5F9)
 * Borders & Dividers: Muted Slate Border (#E2E8F0, #CBD5E1)
 * Primary Accent: Vibrant Corporate Cyan/Teal (#0284C7, #0EA5E9)
 * Regulatory Status Badges:
 *   - Critical: Soft Red / Crimson (#FEE2E2 bg, #DC2626 text, #FECACA border)
 *   - Action Needed: Soft Amber / Orange (#FEF3C7 bg, #B45309 text, #FDE68A border)
 *   - Compliant: Soft Emerald / Green (#D1FAE5 bg, #047857 text, #A7F3D0 border)
 *   - New / Discovery: Soft Cyan / Sky (#E0F2FE bg, #0284C7 text, #BAE6FD border)
 * Text Hierarchy:
 *   - Primary: Deep Midnight Slate (#0F172A)
 *   - Secondary: Slate Gray (#475569)
 *   - Muted: Cool Gray (#64748B)
 *   - Subtle: Light Slate (#94A3B8)
 */

export const colors = {
  // Backgrounds
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceSubtle: '#F1F5F9',

  // Borders & Dividers
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderStrong: '#CBD5E1',
  borderFocus: '#0284C7',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  textSubtle: '#94A3B8',
  textInverse: '#FFFFFF',

  // Primary Brand
  primary: '#0284C7',
  primaryDark: '#0369A1',
  primaryLight: '#E0F2FE',

  // Regulatory / Accent Gold & Amber
  accent: '#D97706',
  accentLight: '#FEF3C7',
  accentDark: '#B45309',

  // Cyan / Teal Brand Accent
  teal: '#0284C7',
  tealLight: '#E0F2FE',
  tealDark: '#0369A1',

  // Semantic Status (Light Theme with high contrast)
  success: '#059669',
  successLight: '#D1FAE5',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  info: '#0284C7',
  infoLight: '#E0F2FE',
} as const;

export type ColorToken = keyof typeof colors;
