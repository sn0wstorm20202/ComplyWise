import {
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../../theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function PrimaryButton({
  title,
  onPress,
  isLoading = false,
  disabled = false,
}: PrimaryButtonProps) {
  const isButtonDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isButtonDisabled ? styles.buttonDisabled : null,
      ]}
      onPress={onPress}
      disabled={isButtonDisabled}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={theme.colors.textInverse} />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: theme.colors.textInverse,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    letterSpacing: 0.3,
  },
});

export default PrimaryButton;
