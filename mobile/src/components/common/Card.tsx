/**
 * Reusable Surface Card for Light Theme
 */

import type { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle, TouchableOpacity } from 'react-native';
import { theme } from '../../theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  activeOpacity?: number;
}

export function Card({ children, style, onPress, activeOpacity = 0.7 }: CardProps) {
  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, style]}
        onPress={onPress}
        activeOpacity={activeOpacity}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    // Subtle elevation shadow
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
});
