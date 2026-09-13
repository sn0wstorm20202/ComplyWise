import { StyleSheet, View, Text } from 'react-native';
import { theme } from '../../theme';

interface FormErrorProps {
  message: string | null;
}

export function FormError({ message }: FormErrorProps) {
  if (!message) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.dangerLight,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  text: {
    color: theme.colors.danger,
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
    lineHeight: theme.typography.lineHeights.tight,
  },
});

export default FormError;
