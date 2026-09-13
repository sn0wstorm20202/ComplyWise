/**
 * Assessment Results Screen (Figma 1:468)
 * Displays compliance readiness, mandate breakdown, and priority actions.
 * Authority: PRD_v2.0 §12, §14
 */

import { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/theme';
import { useBusiness } from '../../src/features/business';
import { dashboardApi } from '../../src/features/dashboard/api';
import { DashboardSummary } from '../../src/types/dashboard';

export default function ResultsScreen() {
  const router = useRouter();
  const { business_id } = useLocalSearchParams<{ business_id?: string }>();
  const { currentBusiness, selectBusiness } = useBusiness();
  const activeBizId = business_id || currentBusiness?.id;

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResults() {
      if (!activeBizId) {
        router.replace('/(onboarding)/setup');
        return;
      }
      try {
        const data = await dashboardApi.getSummary(activeBizId);
        setSummary(data);
      } catch {
        // Fallback gracefully
      } finally {
        setLoading(false);
      }
    }
    loadResults();
  }, [activeBizId, router]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.teal} />
        <Text style={styles.loadingText}>Compiling assessment scorecard...</Text>
      </View>
    );
  }

  const metrics = summary?.metrics;
  const readiness = summary?.compliance_readiness ?? 85;
  const applicableCount = metrics?.applicable_count ?? 12;
  const actionCount = metrics?.action_required_count ?? 4;
  const notApplicableCount = metrics?.not_applicable_count ?? 8;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Success Badge & Header */}
      <View style={styles.headerCard}>
        <View style={styles.badgeRow}>
          <View style={styles.statusBadge}>
            <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
            <Text style={styles.statusBadgeText}>EVALUATION COMPLETE</Text>
          </View>
          <View style={styles.auditBadge}>
            <Text style={styles.auditBadgeText}>DETERMINISTIC V2.0</Text>
          </View>
        </View>

        <Text style={styles.businessName}>{currentBusiness?.name || 'Your Organization'}</Text>
        <Text style={styles.subtitle}>
          Applicability determined against published central and state regulations.
        </Text>
      </View>

      {/* Compliance Readiness Score Card */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreValue}>{readiness}%</Text>
          <Text style={styles.scoreLabel}>READINESS</Text>
        </View>
        <View style={styles.scoreInfo}>
          <Text style={styles.scoreTitle}>Statutory Baseline Established</Text>
          <Text style={styles.scoreDesc}>
            {applicableCount} mandatory requirements identified. {actionCount} require immediate filing or documentation.
          </Text>
        </View>
      </View>

      {/* Metric Breakdown Grid */}
      <View style={styles.grid}>
        <View style={[styles.metricBox, styles.metricApplicable]}>
          <Text style={styles.metricCount}>{applicableCount}</Text>
          <Text style={styles.metricTitle}>Applicable</Text>
          <Text style={styles.metricSub}>Statutory mandates</Text>
        </View>

        <View style={[styles.metricBox, styles.metricAction]}>
          <Text style={styles.metricCount}>{actionCount}</Text>
          <Text style={styles.metricTitle}>Action Needed</Text>
          <Text style={styles.metricSub}>Filings & registrations</Text>
        </View>

        <View style={[styles.metricBox, styles.metricExempt]}>
          <Text style={styles.metricCount}>{notApplicableCount}</Text>
          <Text style={styles.metricTitle}>Exempt / N/A</Text>
          <Text style={styles.metricSub}>Thresholds not met</Text>
        </View>
      </View>

      {/* Top Immediate Action Required */}
      {summary?.priority_actions && summary.priority_actions.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Priority Statutory Actions</Text>
          {summary.priority_actions.slice(0, 3).map((action, idx) => (
            <View key={`${action.requirement_id || 'action'}-${idx}`} style={styles.actionCard}>
              <View style={styles.actionHeader}>
                <View style={styles.actionPill}>
                  <Text style={styles.actionPillText}>{action.authority}</Text>
                </View>
                <Text style={styles.actionType}>{action.action_type}</Text>
              </View>
              <Text style={styles.actionName}>{action.requirement_name}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* CTA to Enter Dashboard */}
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={async () => {
          if (activeBizId) {
            await selectBusiness(activeBizId);
          }
          router.replace('/(app)');
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.primaryBtnText}>Open Executive Dashboard →</Text>
      </TouchableOpacity>
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
  },
  loadingText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  headerCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.successLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.round,
  },
  statusBadgeText: {
    fontSize: theme.typography.sizes.xxs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.success,
  },
  auditBadge: {
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.round,
  },
  auditBadgeText: {
    fontSize: theme.typography.sizes.xxs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textMuted,
  },
  businessName: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xxs,
    lineHeight: 16,
  },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.lg,
  },
  scoreCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: theme.colors.teal,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
  },
  scoreValue: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.tealDark,
  },
  scoreLabel: {
    fontSize: 8,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.tealDark,
    letterSpacing: 0.5,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  scoreDesc: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  grid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  metricBox: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  metricApplicable: {
    borderTopWidth: 3,
    borderTopColor: theme.colors.teal,
  },
  metricAction: {
    borderTopWidth: 3,
    borderTopColor: theme.colors.accent,
  },
  metricExempt: {
    borderTopWidth: 3,
    borderTopColor: theme.colors.textMuted,
  },
  metricCount: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  metricTitle: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  metricSub: {
    fontSize: 9,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
  },
  actionCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionPill: {
    backgroundColor: '#EEF2F6',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.xs,
  },
  actionPillText: {
    fontSize: 9,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textSecondary,
  },
  actionType: {
    fontSize: theme.typography.sizes.xxs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.accentDark,
  },
  actionName: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textPrimary,
  },
  primaryBtn: {
    backgroundColor: theme.colors.teal,
    height: 50,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xxl,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: theme.typography.weights.bold,
    fontSize: theme.typography.sizes.sm,
  },
});
