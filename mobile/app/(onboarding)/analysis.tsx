/**
 * Regulatory Evaluation Processing Screen
 * Runs deterministic applicability analysis and displays live progress steps.
 * Authority: PRD_v2.0 §10, §12, TRD_v2.0 §8
 */

import { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/theme';
import { useBusiness } from '../../src/features/business';
import { onboardingApi } from '../../src/features/onboarding/api';

const ANALYSIS_STEPS = [
  'Validating entity profile & operational variables...',
  'Resolving central, state, and local jurisdictions...',
  'Evaluating deterministic applicability rules against published knowledge...',
  'Checking statutory evidence, validity periods, and filing schedules...',
  'Compiling compliance readiness and action registers...',
];

export default function AnalysisScreen() {
  const router = useRouter();
  const { currentBusiness } = useBusiness();

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Step progression ticker
    intervalRef.current = setInterval(() => {
      setActiveStepIndex((prev) => {
        if (prev < ANALYSIS_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1200);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const runEvaluation = async () => {
    if (!currentBusiness) {
      router.replace('/(onboarding)/setup');
      return;
    }

    setError(null);

    try {
      await onboardingApi.evaluate(currentBusiness.id);
      // Ensure at least a few steps are seen by the user for clarity
      setTimeout(() => {
        router.replace('/(onboarding)/results');
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Evaluation engine request failed.');
    }
  };

  useEffect(() => {
    runEvaluation();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.spinnerContainer}>
          <ActivityIndicator size="large" color={theme.colors.teal} />
        </View>

        <Text style={styles.title}>Evaluating Regulatory Applicability</Text>
        <Text style={styles.subtitle}>
          Executing server-side deterministic logic over published statutory rules
        </Text>

        <View style={styles.stepsBox}>
          {ANALYSIS_STEPS.map((step, idx) => {
            const isDone = idx < activeStepIndex;
            const isCurrent = idx === activeStepIndex;
            return (
              <View key={step} style={styles.stepRow}>
                <View
                  style={[
                    styles.stepIndicator,
                    isDone && styles.stepDone,
                    isCurrent && styles.stepCurrent,
                  ]}
                >
                  {isDone ? (
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  ) : (
                    <Text
                      style={[
                        styles.stepNum,
                        isCurrent && styles.stepNumCurrent,
                      ]}
                    >
                      {idx + 1}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepText,
                    isCurrent && styles.stepTextCurrent,
                    isDone && styles.stepTextDone,
                  ]}
                >
                  {step}
                </Text>
              </View>
            );
          })}
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color={theme.colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={runEvaluation}>
              <Text style={styles.retryBtnText}>Retry Analysis</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  spinnerContainer: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.xxs,
  },
  subtitle: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  stepsBox: {
    width: '100%',
    gap: theme.spacing.md,
    marginVertical: theme.spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDone: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  stepCurrent: {
    backgroundColor: '#F0FDFA',
    borderColor: theme.colors.teal,
  },
  stepNum: {
    fontSize: 10,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textMuted,
  },
  stepNumCurrent: {
    color: theme.colors.tealDark,
  },
  stepText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    flex: 1,
  },
  stepTextCurrent: {
    color: theme.colors.tealDark,
    fontWeight: theme.typography.weights.semibold,
  },
  stepTextDone: {
    color: theme.colors.textPrimary,
  },
  errorBox: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.dangerLight,
    borderRadius: theme.borderRadius.sm,
    width: '100%',
  },
  errorText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.danger,
    textAlign: 'center',
    marginVertical: theme.spacing.xs,
  },
  retryBtn: {
    backgroundColor: theme.colors.teal,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.xs,
    marginTop: theme.spacing.xs,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: theme.typography.weights.semibold,
    fontSize: theme.typography.sizes.xs,
  },
});
