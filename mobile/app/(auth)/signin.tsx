/**
 * ComplyWise Mobile - Sign In Screen
 *
 * Structure directly inspired by Figma `ui layers/ComplyWise - Frosted Glass Sign In.png`,
 * styled in an Executive Light Theme.
 */

import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/features/auth';

export default function SignInScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [fieldError, setFieldError] = useState('');

  const handleSignIn = async () => {
    clearError();
    setFieldError('');

    const trimmed = email.trim();
    if (!trimmed) {
      setFieldError('Please enter your business email.');
      return;
    }
    if (!password) {
      setFieldError('Please enter your password.');
      return;
    }

    try {
      await login({ email: trimmed, password });
      router.replace('/(app)');
    } catch {
      // Handled by AuthContext
    }
  };

  const handleFastDemoLogin = async () => {
    clearError();
    setFieldError('');
    try {
      await login({
        email: 'compliance.officer@example.com',
        password: 'CompliancePass123!',
      });
      router.replace('/(app)');
    } catch {
      // Handled by context
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* White Surface Card */}
        <View style={styles.card}>
          {/* Top Brand Shield Badge */}
          <View style={styles.shieldWrapper}>
            <View style={styles.shieldCircle}>
              <Ionicons name="shield-checkmark" size={26} color="#0284C7" />
            </View>
          </View>

          {/* Title & Brand */}
          <View style={styles.brandRow}>
            <Text style={styles.brandTitle}>ComplyWise</Text>
            <View style={styles.cyanDot} />
          </View>
          <Text style={styles.brandSub}>AI-powered compliance intelligence</Text>

          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.subheading}>
            Sign in to continue to your compliance workspace.
          </Text>

          {/* Form / Global Error */}
          {error || fieldError ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#DC2626" />
              <Text style={styles.errorText}>{fieldError || error}</Text>
            </View>
          ) : null}

          {/* Business Email Input */}
          <Text style={styles.inputLabel}>Business email</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="name@company.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!isLoading}
            />
          </View>

          {/* Password Input */}
          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Password</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="••••••••••••"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
            />
          </View>

          {/* Remember Me Checkbox */}
          <TouchableOpacity
            style={styles.rememberRow}
            onPress={() => setRememberMe(!rememberMe)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
              {rememberMe ? (
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              ) : null}
            </View>
            <Text style={styles.rememberText}>Remember me</Text>
          </TouchableOpacity>

          {/* Primary Submit Button */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSignIn}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Sign In</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          {/* Demo Login Button */}
          <TouchableOpacity
            style={styles.demoButton}
            onPress={handleFastDemoLogin}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Text style={styles.demoButtonText}>⚡ Quick Demo Sign In</Text>
          </TouchableOpacity>

          {/* OR Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google SSO Button */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleFastDemoLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-google" size={18} color="#EA4335" />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
            <Ionicons name="arrow-forward" size={16} color="#64748B" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerPrompt}>New to ComplyWise? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.registerLink}>Create business profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Assurance Banner */}
        <View style={styles.securityBanner}>
          <Ionicons name="shield-checkmark-outline" size={15} color="#0284C7" />
          <Text style={styles.securityText}>
            Secure business data • Evidence-backed intelligence
          </Text>
        </View>

        {/* Footer Links */}
        <View style={styles.footerRow}>
          <Text style={styles.footerLink}>Privacy</Text>
          <Text style={styles.footerDot}>•</Text>
          <Text style={styles.footerLink}>Terms</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 36,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  shieldWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  shieldCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  cyanDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0284C7',
  },
  brandSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  subheading: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  inputRow: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    marginBottom: 20,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  rememberText: {
    fontSize: 13,
    color: '#475569',
  },
  primaryButton: {
    backgroundColor: '#0284C7',
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  demoButton: {
    marginTop: 10,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  registerPrompt: {
    fontSize: 13,
    color: '#64748B',
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
  },
  securityText: {
    fontSize: 12,
    color: '#64748B',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  footerLink: {
    fontSize: 11,
    color: '#94A3B8',
  },
  footerDot: {
    fontSize: 11,
    color: '#94A3B8',
  },
});
