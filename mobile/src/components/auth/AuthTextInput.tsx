import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TextInputProps,
} from 'react-native';
import { theme } from '../../theme';

interface AuthTextInputProps extends TextInputProps {
  label: string;
  error?: string;
}

export function AuthTextInput({
  label,
  error,
  ...inputProps
}: AuthTextInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error ? styles.inputError : null,
        ]}
        placeholderTextColor={theme.colors.textSubtle}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoCapitalize="none"
        {...inputProps}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
  },
  inputFocused: {
    borderColor: theme.colors.borderFocus,
  },
  inputError: {
    borderColor: theme.colors.danger,
    backgroundColor: theme.colors.dangerLight + '20',
  },
  errorText: {
    fontSize: theme.typography.sizes.xxs,
    color: theme.colors.danger,
    marginTop: theme.spacing.xxs,
    fontWeight: theme.typography.weights.medium,
  },
});

export default AuthTextInput;
