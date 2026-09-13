/**
 * ComplyWise Mobile - Root Layout & Protected Navigation Gate
 *
 * Authority: TRD_v2.0 §31
 *
 * Enforces:
 * 1. AuthProvider wraps the complete application hierarchy
 * 2. Splash screen displays without flicker during session hydration
 * 3. Unauthenticated users cannot enter (app) routes
 * 4. Authenticated users are redirected away from (auth) routes
 */

import { useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/features/auth';
import { BusinessProvider, useBusiness } from '../src/features/business';
import { theme } from '../src/theme';

function NavigationGate() {
  const { status, isAuthenticated } = useAuth();
  const { businesses, isLoading: businessLoading, isLoaded: businessLoaded } = useBusiness();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Wait until auth hydration AND initial business fetch have both finished
    if (status === 'INITIALIZING' || (isAuthenticated && (!businessLoaded || businessLoading))) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect unauthenticated user to sign in
      router.replace('/(auth)/signin');
    } else if (isAuthenticated && inAuthGroup) {
      // Authenticated user in auth flow:
      // If user has zero businesses, redirect them to onboarding setup!
      // If user already has businesses, route directly to dashboard!
      if (businesses.length === 0) {
        router.replace('/(onboarding)/setup');
      } else {
        router.replace('/(app)');
      }
    } else if (isAuthenticated && segments[0] === '(app)' && businesses.length === 0) {
      // User has authenticated session but no registered business profile yet
      router.replace('/(onboarding)/setup');
    }
  }, [status, isAuthenticated, businesses, businessLoading, businessLoaded, segments, router]);

  // Render branded light splash while hydrating session or loading business profile
  if (status === 'INITIALIZING' || (isAuthenticated && (!businessLoaded || businessLoading))) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.splashCard}>
          <View style={styles.splashBadge}>
            <Text style={styles.splashBadgeText}>COMPLYWISE ENTERPRISE</Text>
          </View>
          <Text style={styles.splashTitle}>ComplyWise</Text>
          <Text style={styles.splashSubtitle}>
            Industrial Regulatory Intelligence
          </Text>
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            style={styles.splashSpinner}
          />
          <Text style={styles.splashStatus}>
            {status === 'INITIALIZING'
              ? 'Verifying secure session...'
              : 'Loading business profile...'}
          </Text>
        </View>
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <BusinessProvider>
          <NavigationGate />
        </BusinessProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  splashCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    width: '100%',
    maxWidth: 360,
  },
  splashBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: theme.spacing.md,
  },
  splashBadgeText: {
    fontSize: theme.typography.sizes.xxs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
    letterSpacing: 1,
  },
  splashTitle: {
    fontSize: theme.typography.sizes.display,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xxs,
  },
  splashSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  splashSpinner: {
    marginBottom: theme.spacing.md,
  },
  splashStatus: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    fontWeight: theme.typography.weights.medium,
  },
});
