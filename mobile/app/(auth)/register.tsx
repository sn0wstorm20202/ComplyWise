/**
 * ComplyWise Mobile - Registration Screen
 *
 * Authority: TRD_v2.0 §31
 *
 * Calls useAuth().register -> POST /api/v1/auth/register.
 * The backend directly issues an authentication token upon successful registration.
 */

import { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/features/auth';
import {
  AuthScreenContainer,
  AuthTextInput,
  PrimaryButton,
  FormError,
} from '../../src/components';
import { theme } from '../../src/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const validate = (): boolean => {
    let isValid = true;
    setFullNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    clearError();

    if (!fullName.trim()) {
      setFullNameError('Full name is required.');
      isValid = false;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Email address is required.');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address.');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required.');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      isValid = false;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      isValid = false;
    }

    return isValid;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    try {
      await register({
        email,
        password,
        full_name: fullName,
      });
      // Navigation is automatically handled by the AuthGuard in _layout.tsx
    } catch {
      // Handled by AuthContext
    }
  };

  return (
    <AuthScreenContainer
      title="Create Account"
      subtitle="Register to start tracking regulatory compliance."
    >
      <FormError message={error} />

      <AuthTextInput
        label="Full Name"
        placeholder="e.g. Rahul Sharma"
        autoComplete="name"
        value={fullName}
        onChangeText={(text) => {
          setFullName(text);
          if (fullNameError) setFullNameError('');
        }}
        error={fullNameError}
        editable={!isLoading}
      />

      <AuthTextInput
        label="Business Email"
        placeholder="rahul@company.in"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (emailError) setEmailError('');
        }}
        error={emailError}
        editable={!isLoading}
      />

      <AuthTextInput
        label="Password"
        placeholder="At least 8 characters"
        secureTextEntry
        autoComplete="new-password"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (passwordError) setPasswordError('');
        }}
        error={passwordError}
        editable={!isLoading}
      />

      <AuthTextInput
        label="Confirm Password"
        placeholder="Re-enter password"
        secureTextEntry
        autoComplete="new-password"
        value={confirmPassword}
        onChangeText={(text) => {
          setConfirmPassword(text);
          if (confirmPasswordError) setConfirmPasswordError('');
        }}
        error={confirmPasswordError}
        editable={!isLoading}
      />

      <PrimaryButton
        title="Register &amp; Proceed"
        onPress={handleRegister}
        isLoading={isLoading}
      />

      <View style={styles.switchAuthRow}>
        <Text style={styles.switchAuthText}>Already have an account? </Text>
        <TouchableOpacity
          onPress={() => router.push('/(auth)/signin')}
          disabled={isLoading}
        >
          <Text style={styles.switchAuthLink}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </AuthScreenContainer>
  );
}

const styles = StyleSheet.create({
  switchAuthRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  switchAuthText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
  switchAuthLink: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.accent,
  },
});
