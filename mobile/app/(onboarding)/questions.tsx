/**
 * Smart Questions Dynamic Assessment Screen
 * Authority: PRD_v2.0 §10, TRD_v2.0 §8
 */

import { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/theme';
import { useBusiness } from '../../src/features/business';
import { onboardingApi } from '../../src/features/onboarding/api';
import { SmartQuestion } from '../../src/types/onboarding';

export default function SmartQuestionsScreen() {
  const router = useRouter();
  const { currentBusiness } = useBusiness();

  const [round, setRound] = useState(1);
  const [questions, setQuestions] = useState<SmartQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async (r: number) => {
    if (!currentBusiness) {
      router.replace('/(onboarding)/setup');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const plan = await onboardingApi.getQuestions(currentBusiness.id, r);
      const qList = plan.questions || [];
      setQuestions(qList);

      // Pre-fill answers with default/current values if available
      const initial: Record<string, unknown> = {};
      for (const q of qList) {
        if (q.current_value !== undefined && q.current_value !== null) {
          initial[q.key] = q.current_value;
        } else if (q.data_type === 'BOOLEAN') {
          initial[q.key] = false;
        } else if (q.options && q.options.length > 0) {
          initial[q.key] = q.options[0].value;
        }
      }
      setAnswers((prev) => ({ ...initial, ...prev }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve smart questions.');
    } finally {
      setLoading(false);
    }
  }, [currentBusiness, router]);

  useEffect(() => {
    fetchQuestions(round);
  }, [fetchQuestions, round]);

  const handleAnswerChange = (key: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!currentBusiness) return;
    setSubmitting(true);
    setError(null);

    try {
      const formattedAnswers: Record<string, unknown> = {};
      for (const q of questions) {
        const val = answers[q.key];
        if (val === undefined || val === null || val === '') continue;

        if (q.data_type === 'BOOLEAN') {
          formattedAnswers[q.key] = Boolean(val);
        } else if (
          q.data_type === 'INTEGER' ||
          q.data_type === 'DECIMAL' ||
          q.data_type === 'CURRENCY_INR'
        ) {
          const num = Number(val);
          if (Number.isFinite(num)) {
            formattedAnswers[q.key] = num;
          }
        } else {
          formattedAnswers[q.key] = val;
        }
      }

      const res = await onboardingApi.submitAnswers(currentBusiness.id, formattedAnswers);
      if (res.has_more_questions) {
        setRound((prev) => prev + 1);
      } else {
        router.push('/(onboarding)/analysis');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record answers.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.teal} />
        <Text style={styles.loadingText}>Fetching adaptive compliance inquiries...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Progress Header */}
      <View style={styles.progressRow}>
        <View style={[styles.stepDot, styles.stepDotDone]}>
          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
        </View>
        <View style={[styles.stepLine, styles.stepLineActive]} />
        <View style={[styles.stepDot, styles.stepDotActive]}>
          <Text style={styles.stepDotText}>2</Text>
        </View>
        <View style={styles.stepLine} />
        <View style={styles.stepDot}>
          <Text style={styles.stepDotTextInactive}>3</Text>
        </View>
      </View>

      <View style={styles.headerBox}>
        <View style={styles.roundBadge}>
          <Text style={styles.roundBadgeText}>ROUND {round} OF 2</Text>
        </View>
        <Text style={styles.headline}>Targeted Inquiries</Text>
        <Text style={styles.subhead}>
          Answer these operational specifics to rule in or eliminate statutory obligations.
        </Text>
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle" size={18} color={theme.colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {questions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="checkmark-circle-outline" size={44} color={theme.colors.success} />
          <Text style={styles.emptyTitle}>Sufficient Information Gathered</Text>
          <Text style={styles.emptySub}>
            Your core profile is ready for deterministic applicability evaluation.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push('/(onboarding)/analysis')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>Run Regulatory Analysis →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        questions.map((q, idx) => (
          <View key={`${q.key || 'q'}-${idx}`} style={styles.questionCard}>
            <Text style={styles.questionNumber}>QUESTION {idx + 1}</Text>
            <Text style={styles.questionTitle}>{q.label || q.question_text}</Text>

            {q.why_it_matters ? (
              <View style={styles.whyBox}>
                <Ionicons name="information-circle-outline" size={14} color={theme.colors.teal} />
                <Text style={styles.whyText}>{q.why_it_matters}</Text>
              </View>
            ) : null}

            {/* Render input depending on question type */}
            {q.data_type === 'BOOLEAN' ? (
              <View style={styles.boolRow}>
                <TouchableOpacity
                  style={[styles.boolBtn, answers[q.key] === true && styles.boolBtnActive]}
                  onPress={() => handleAnswerChange(q.key, true)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.boolText, answers[q.key] === true && styles.boolTextActive]}
                  >
                    Yes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.boolBtn, answers[q.key] === false && styles.boolBtnActive]}
                  onPress={() => handleAnswerChange(q.key, false)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.boolText, answers[q.key] === false && styles.boolTextActive]}
                  >
                    No
                  </Text>
                </TouchableOpacity>
              </View>
            ) : q.options && q.options.length > 0 ? (
              <View style={styles.optionsList}>
                {q.options.map((opt, optIdx) => {
                  const isSel = answers[q.key] === opt.value;
                  return (
                    <TouchableOpacity
                      key={`${opt.value}-${optIdx}`}
                      style={[styles.optionItem, isSel && styles.optionItemActive]}
                      onPress={() => handleAnswerChange(q.key, opt.value)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={isSel ? 'radio-button-on' : 'radio-button-off'}
                        size={18}
                        color={isSel ? theme.colors.teal : theme.colors.textMuted}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.optLabel, isSel && styles.optLabelActive]}>
                          {opt.label}
                        </Text>
                        {opt.description ? (
                          <Text style={styles.optDesc}>{opt.description}</Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  value={String(answers[q.key] ?? '')}
                  onChangeText={(val) => handleAnswerChange(q.key, val)}
                  placeholder={q.placeholder || 'Enter value...'}
                  placeholderTextColor={theme.colors.textSubtle}
                  keyboardType={
                    q.data_type === 'INTEGER' || q.data_type === 'DECIMAL'
                      ? 'numeric'
                      : 'default'
                  }
                />
                {q.unit ? <Text style={styles.unitText}>{q.unit}</Text> : null}
              </View>
            )}
          </View>
        ))
      )}

      {questions.length > 0 ? (
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>Save & Proceed →</Text>
          )}
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotDone: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  stepDotActive: {
    backgroundColor: theme.colors.teal,
    borderColor: theme.colors.teal,
  },
  stepDotText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
  },
  stepDotTextInactive: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.sizes.xs,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.xs,
  },
  stepLineActive: {
    backgroundColor: theme.colors.teal,
  },
  headerBox: {
    marginBottom: theme.spacing.lg,
  },
  roundBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.round,
    marginBottom: theme.spacing.xs,
  },
  roundBadgeText: {
    fontSize: theme.typography.sizes.xxs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.tealDark,
    letterSpacing: 0.5,
  },
  headline: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xxs,
  },
  subhead: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.lineHeights.normal,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.dangerLight,
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.danger,
    flex: 1,
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginVertical: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  emptySub: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  primaryBtn: {
    backgroundColor: theme.colors.teal,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: theme.typography.weights.bold,
    fontSize: theme.typography.sizes.sm,
  },
  questionCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  questionNumber: {
    fontSize: theme.typography.sizes.xxs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  questionTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    lineHeight: 20,
    marginBottom: theme.spacing.xs,
  },
  whyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.teal,
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.xs,
    marginBottom: theme.spacing.md,
  },
  whyText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  boolRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  boolBtn: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  boolBtnActive: {
    backgroundColor: '#F0FDFA',
    borderColor: theme.colors.teal,
  },
  boolText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.medium,
  },
  boolTextActive: {
    color: theme.colors.tealDark,
    fontWeight: theme.typography.weights.bold,
  },
  optionsList: {
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  optionItemActive: {
    borderColor: theme.colors.teal,
    backgroundColor: '#F0FDFA',
  },
  optLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textPrimary,
  },
  optLabelActive: {
    color: theme.colors.tealDark,
    fontWeight: theme.typography.weights.semibold,
  },
  optDesc: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    height: 46,
    backgroundColor: theme.colors.surface,
  },
  textInput: {
    flex: 1,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textPrimary,
  },
  unitText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    fontWeight: theme.typography.weights.semibold,
    marginLeft: theme.spacing.xs,
  },
  submitBtn: {
    backgroundColor: theme.colors.teal,
    height: 50,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xxl,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
  },
});
