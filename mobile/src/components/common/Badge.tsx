/**
 * Executive Regulatory Status Badge (Light Theme)
 *
 * Direct structural inspiration from Figma `ui layers/` with clean light theme styling.
 */

import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { theme } from '../../theme';

export type BadgeVariant =
  | 'APPLICABLE'
  | 'NOT_APPLICABLE'
  | 'NEEDS_INFORMATION'
  | 'CONFLICT_REVIEW'
  | 'UNVERIFIED'
  | 'SUCCESS'
  | 'WARNING'
  | 'DANGER'
  | 'INFO'
  | 'NEUTRAL'
  | 'CRITICAL'
  | 'ACTION_NEEDED'
  | 'COMPLIANT'
  | 'NEW';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant | string;
  style?: ViewStyle;
  size?: 'sm' | 'md';
  showDot?: boolean;
}

export function Badge({
  label,
  variant = 'NEUTRAL',
  style,
  size = 'sm',
  showDot = false,
}: BadgeProps) {
  const normVariant = (variant || 'NEUTRAL').toUpperCase().replace(/\s+/g, '_');

  let bg: string = '#F1F5F9';
  let text: string = '#475569';
  let border: string = '#E2E8F0';
  let dotColor: string | null = null;

  switch (normVariant) {
    case 'CRITICAL':
    case 'DANGER':
      bg = '#FEE2E2';
      text = '#DC2626';
      border = '#FECACA';
      dotColor = '#EF4444';
      break;

    case 'ACTION_NEEDED':
    case 'ACTION':
    case 'CONFLICT_REVIEW':
    case 'WARNING':
      bg = '#FEF3C7';
      text = '#B45309';
      border = '#FDE68A';
      dotColor = '#F59E0B';
      break;

    case 'COMPLIANT':
    case 'APPLICABLE':
    case 'SUCCESS':
      bg = '#D1FAE5';
      text = '#047857';
      border = '#A7F3D0';
      dotColor = '#10B981';
      break;

    case 'NEW':
    case 'NEEDS_INFORMATION':
    case 'INFO':
      bg = '#E0F2FE';
      text = '#0284C7';
      border = '#BAE6FD';
      dotColor = '#0EA5E9';
      break;

    case 'NOT_APPLICABLE':
    case 'UNVERIFIED':
    case 'NEUTRAL':
    default:
      bg = '#F1F5F9';
      text = '#475569';
      border = '#E2E8F0';
      dotColor = null;
      break;
  }

  const shouldRenderDot = showDot || !!dotColor;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg, borderColor: border },
        size === 'md' && styles.badgeMd,
        style,
      ]}
    >
      {shouldRenderDot && dotColor ? (
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
      ) : null}
      <Text
        style={[
          styles.text,
          { color: text },
          size === 'md' && styles.textMd,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeMd: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: theme.typography.sizes.xxs,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  textMd: {
    fontSize: theme.typography.sizes.xs,
  },
});
