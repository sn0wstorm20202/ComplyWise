/**
 * Organization Setup Screen
 * Captures statutory entity identity, jurisdiction, scale, and activities
 * strictly aligned with the canonical variable registry (domain/profile/variables.py).
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
import { businessApi } from '../../src/features/business/api';
import { onboardingApi } from '../../src/features/onboarding/api';

const STATES = [
  'Maharashtra',
  'Karnataka',
  'Gujarat',
  'Tamil Nadu',
  'Delhi',
  'Telangana',
  'Uttar Pradesh',
  'West Bengal',
  'Rajasthan',
  'Haryana',
  'Andhra Pradesh',
  'Kerala',
  'Madhya Pradesh',
  'Punjab',
  'Odisha',
];

const CONSTITUTIONS = [
  { value: 'PRIVATE_LIMITED', label: 'Private Limited Company (Pvt Ltd)' },
  { value: 'LLP', label: 'Limited Liability Partnership (LLP)' },
  { value: 'PROPRIETORSHIP', label: 'Sole Proprietorship' },
  { value: 'PARTNERSHIP', label: 'Partnership Firm' },
  { value: 'PUBLIC_LIMITED', label: 'Public Limited Company' },
  { value: 'ONE_PERSON_COMPANY', label: 'One Person Company' },
];

const LIFECYCLE_STAGES = [
  { value: 'OPERATIONAL', label: 'Operational (Active Manufacturing/Trade)' },
  { value: 'UNDER_SETUP', label: 'Under Setup / Factory Commissioning' },
  { value: 'EXPANDING', label: 'Expanding Existing Capacity' },
  { value: 'PLANNED', label: 'Planned / Pre-incorporation' },
];

const INDUSTRIAL_ZONES = [
  {
    value: 'INSIDE_NOTIFIED_INDUSTRIAL_AREA',
    label: 'Inside Notified Industrial Estate (GIDC / MIDC / KIADB / HSIIDC)',
  },
  {
    value: 'OUTSIDE_NOTIFIED_INDUSTRIAL_AREA',
    label: 'Outside Notified Industrial Area',
  },
  {
    value: 'SPECIAL_ECONOMIC_ZONE',
    label: 'Special Economic Zone (SEZ)',
  },
  {
    value: 'NOT_KNOWN',
    label: 'Not Known / Verification Needed',
  },
];

const TRADE_INTENTS = [
  { value: 'DOMESTIC_ONLY', label: 'Domestic Indian Market Only' },
  { value: 'IMPORT_ONLY', label: 'Domestic + Raw Material Imports' },
  { value: 'EXPORT_ONLY', label: 'Domestic + Finished Goods Exporter' },
  { value: 'IMPORT_AND_EXPORT', label: 'Both Import & Export Operations' },
  { value: 'NONE', label: 'No Import or Export' },
];

export default function BusinessSetupScreen() {
  const router = useRouter();
  const { businesses, currentBusiness, createBusiness, refreshBusinesses } = useBusiness();

  // Core Identity & Constitution
  const [businessName, setBusinessName] = useState(currentBusiness?.name || '');
  const [legalConstitution, setLegalConstitution] = useState('PRIVATE_LIMITED');
  const [lifecycleStage, setLifecycleStage] = useState('OPERATIONAL');

  // Jurisdiction & Siting
  const [registeredState, setRegisteredState] = useState('Maharashtra');
  const [district, setDistrict] = useState('');
  const [industrialZone, setIndustrialZone] = useState('INSIDE_NOTIFIED_INDUSTRIAL_AREA');

  // Scale & Workforce
  const [plantInvestmentLakhs, setPlantInvestmentLakhs] = useState('');
  const [turnoverLakhs, setTurnoverLakhs] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');

  // Products & Activities
  const [productDesc, setProductDesc] = useState(
    'Processing and packaging of packaged food products and commercial consumer goods.'
  );
  const [tradeIntent, setTradeIntent] = useState('DOMESTIC_ONLY');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill existing business profile if available
  const preloadProfile = useCallback(async () => {
    if (!currentBusiness?.id) return;
    try {
      const profileData = await businessApi.getBusinessProfile(currentBusiness.id);
      const cv = profileData.current_version?.variables;
      if (cv) {
        if (cv.legal_constitution?.value) {
          setLegalConstitution(String(cv.legal_constitution.value));
        }
        if (cv.lifecycle_stage?.value) {
          setLifecycleStage(String(cv.lifecycle_stage.value));
        }
        if (cv.state?.value) {
          setRegisteredState(String(cv.state.value));
        }
        if (cv.district?.value) {
          setDistrict(String(cv.district.value));
        }
        if (cv.industrial_zone_status?.value) {
          setIndustrialZone(String(cv.industrial_zone_status.value));
        }
        if (cv.plant_machinery_investment?.value) {
          setPlantInvestmentLakhs(
            String(Math.round(Number(cv.plant_machinery_investment.value) / 100000))
          );
        }
        if (cv.annual_turnover?.value) {
          setTurnoverLakhs(
            String(Math.round(Number(cv.annual_turnover.value) / 100000))
          );
        }
        if (cv.total_worker_count?.value) {
          setEmployeeCount(String(cv.total_worker_count.value));
        }
        if (cv.product_description?.value) {
          setProductDesc(String(cv.product_description.value));
        }
        if (cv.import_export_intent?.value) {
          setTradeIntent(String(cv.import_export_intent.value));
        }
      }
    } catch {
      // Ignore preloading failures; continue with clean form
    }
  }, [currentBusiness?.id]);

  useEffect(() => {
    preloadProfile();
  }, [preloadProfile]);

  const handleContinue = async () => {
    const trimmedName = businessName.trim();
    if (!trimmedName) {
      setError('Please provide your legal business or entity name.');
      return;
    }
    if (!productDesc.trim()) {
      setError('Please briefly describe your primary products or operational activities.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let bizId = currentBusiness?.id;
      if (!bizId || (currentBusiness && currentBusiness.name !== trimmedName)) {
        const created = await createBusiness(trimmedName);
        bizId = created.id;
      }

      // Convert Lakhs to raw INR
      const lakhsToInr = (raw: string) =>
        raw.trim() === '' ? '' : Math.round(Number(raw) * 100000);

      // Build strictly canonical variable dictionary
      const variables: Record<string, { value: unknown; origin: string }> = {};
      const put = (key: string, value: unknown) => {
        if (value !== '' && value !== null && value !== undefined) {
          variables[key] = { value, origin: 'USER_PROVIDED' };
        }
      };

      put('legal_constitution', legalConstitution);
      put('lifecycle_stage', lifecycleStage);
      put('state', registeredState);
      put('district', district.trim() || undefined);
      put('industrial_zone_status', industrialZone);

      if (plantInvestmentLakhs.trim()) {
        put('plant_machinery_investment', lakhsToInr(plantInvestmentLakhs));
      }
      if (turnoverLakhs.trim()) {
        put('annual_turnover', lakhsToInr(turnoverLakhs));
      }
      if (employeeCount.trim()) {
        const parsed = parseInt(employeeCount, 10);
        if (!isNaN(parsed)) put('total_worker_count', parsed);
      }
      if (tradeIntent) {
        put('import_export_intent', tradeIntent);
      }

      // 1. Submit structured canonical profile version
      await businessApi.saveBusinessProfile(
        bizId,
        variables,
        'Initial business profile submitted during onboarding',
        false
      );

      // 2. Submit natural language products & activities
      await onboardingApi.submitProductsActivities(
        bizId,
        productDesc.trim(),
        tradeIntent
      );

      await refreshBusinesses();
      router.push('/(onboarding)/questions');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save business profile.');
    } finally {
      setLoading(false);
    }
  };

  const hasExistingBusinesses = businesses.length > 0;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Top Bar for Existing Businesses */}
      {hasExistingBusinesses ? (
        <TouchableOpacity
          style={styles.returnButton}
          onPress={() => router.replace('/(app)')}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={16} color={theme.colors.primary} />
          <Text style={styles.returnButtonText}>Return to Dashboard</Text>
        </TouchableOpacity>
      ) : null}

      {/* Progress Header */}
      <View style={styles.progressRow}>
        <View style={[styles.stepDot, styles.stepDotActive]}>
          <Text style={styles.stepDotText}>1</Text>
        </View>
        <View style={styles.stepLine} />
        <View style={styles.stepDot}>
          <Text style={styles.stepDotTextInactive}>2</Text>
        </View>
        <View style={styles.stepLine} />
        <View style={styles.stepDot}>
          <Text style={styles.stepDotTextInactive}>3</Text>
        </View>
      </View>

      <Text style={styles.headline}>Profile Your Organization</Text>
      <Text style={styles.subhead}>
        ComplyWise deterministically maps statutory mandates using your jurisdiction, constitution,
        and activities registry.
      </Text>

      {error ? (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle" size={18} color={theme.colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Section 1: Entity Identity */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>1. Enterprise Identity & Constitution</Text>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Legal Entity Name *</Text>
        <TextInput
          style={styles.input}
          value={businessName}
          onChangeText={setBusinessName}
          placeholder="e.g. Apex Biotech Labs Private Limited"
          placeholderTextColor={theme.colors.textSubtle}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Legal Constitution *</Text>
        <View style={styles.verticalOptions}>
          {CONSTITUTIONS.map((c) => {
            const isSel = legalConstitution === c.value;
            return (
              <TouchableOpacity
                key={c.value}
                style={[styles.optionCard, isSel && styles.optionCardActive]}
                onPress={() => setLegalConstitution(c.value)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isSel ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={isSel ? theme.colors.primary : theme.colors.textMuted}
                />
                <Text style={[styles.optionText, isSel && styles.optionTextActive]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Operational Lifecycle Stage *</Text>
        <View style={styles.verticalOptions}>
          {LIFECYCLE_STAGES.map((st) => {
            const isSel = lifecycleStage === st.value;
            return (
              <TouchableOpacity
                key={st.value}
                style={[styles.optionCard, isSel && styles.optionCardActive]}
                onPress={() => setLifecycleStage(st.value)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isSel ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={isSel ? theme.colors.primary : theme.colors.textMuted}
                />
                <Text style={[styles.optionText, isSel && styles.optionTextActive]}>
                  {st.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Section 2: Jurisdiction & Siting */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>2. Jurisdiction & Siting</Text>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>State of Primary Operations *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {STATES.map((s) => {
            const isSel = registeredState === s;
            return (
              <TouchableOpacity
                key={s}
                style={[styles.chip, isSel && styles.chipActive]}
                onPress={() => setRegisteredState(s)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isSel && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>District / Operating Location</Text>
        <TextInput
          style={styles.input}
          value={district}
          onChangeText={setDistrict}
          placeholder="e.g. Pune, Ahmedabad, or Bengaluru Urban"
          placeholderTextColor={theme.colors.textSubtle}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Industrial Zone Status *</Text>
        <View style={styles.verticalOptions}>
          {INDUSTRIAL_ZONES.map((z) => {
            const isSel = industrialZone === z.value;
            return (
              <TouchableOpacity
                key={z.value}
                style={[styles.optionCard, isSel && styles.optionCardActive]}
                onPress={() => setIndustrialZone(z.value)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isSel ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={isSel ? theme.colors.primary : theme.colors.textMuted}
                />
                <Text style={[styles.optionText, isSel && styles.optionTextActive]}>
                  {z.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Section 3: Scale & Workforce */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>3. Scale & Workforce</Text>
      </View>

      <View style={styles.rowFields}>
        <View style={[styles.fieldGroup, { flex: 1, marginRight: theme.spacing.sm }]}>
          <Text style={styles.label}>Plant & Machinery (₹ Lakhs)</Text>
          <TextInput
            style={styles.input}
            value={plantInvestmentLakhs}
            onChangeText={setPlantInvestmentLakhs}
            placeholder="e.g. 50"
            placeholderTextColor={theme.colors.textSubtle}
            keyboardType="numeric"
          />
        </View>

        <View style={[styles.fieldGroup, { flex: 1 }]}>
          <Text style={styles.label}>Annual Turnover (₹ Lakhs)</Text>
          <TextInput
            style={styles.input}
            value={turnoverLakhs}
            onChangeText={setTurnoverLakhs}
            placeholder="e.g. 250"
            placeholderTextColor={theme.colors.textSubtle}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Total Workforce Count (Direct + Contract)</Text>
        <TextInput
          style={styles.input}
          value={employeeCount}
          onChangeText={setEmployeeCount}
          placeholder="e.g. 45"
          placeholderTextColor={theme.colors.textSubtle}
          keyboardType="numeric"
        />
      </View>

      {/* Section 4: Products & Activities */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>4. Products & Activities</Text>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Products & Activities Description *</Text>
        <Text style={styles.helperText}>
          Describe what you manufacture, trade, or deliver in natural language so the system
          detects statutory standards.
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={productDesc}
          onChangeText={setProductDesc}
          placeholder="e.g. Processing and packaging of dairy beverages, whey protein, and packaged yogurt."
          placeholderTextColor={theme.colors.textSubtle}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Cross-Border Trade Intent *</Text>
        <View style={styles.verticalOptions}>
          {TRADE_INTENTS.map((t) => {
            const isSel = tradeIntent === t.value;
            return (
              <TouchableOpacity
                key={t.value}
                style={[styles.optionCard, isSel && styles.optionCardActive]}
                onPress={() => setTradeIntent(t.value)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isSel ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={isSel ? theme.colors.primary : theme.colors.textMuted}
                />
                <Text style={[styles.optionText, isSel && styles.optionTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleContinue}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>Continue to Smart Questions →</Text>
        )}
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
  returnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.round,
    marginBottom: theme.spacing.md,
  },
  returnButtonText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
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
  stepDotActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
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
    marginBottom: theme.spacing.lg,
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
  sectionHeader: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    paddingBottom: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  fieldGroup: {
    marginBottom: theme.spacing.md,
  },
  rowFields: {
    flexDirection: 'row',
  },
  label: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.xs,
  },
  helperText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
    lineHeight: 16,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    height: 46,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textPrimary,
  },
  textArea: {
    height: 80,
    paddingTop: theme.spacing.sm,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    marginTop: theme.spacing.xxs,
  },
  chip: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.round,
    marginRight: theme.spacing.xs,
  },
  chipActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
  },
  chipTextActive: {
    color: theme.colors.primaryDark,
    fontWeight: theme.typography.weights.bold,
  },
  verticalOptions: {
    gap: theme.spacing.xs,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
  },
  optionCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  optionText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  optionTextActive: {
    color: theme.colors.primaryDark,
    fontWeight: theme.typography.weights.semibold,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    height: 50,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xxl,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
  },
});
