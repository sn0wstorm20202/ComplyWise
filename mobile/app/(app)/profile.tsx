/**
 * Profile & Organization Screen
 * Authority: TRD_v2.0 §31, §32
 */

import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/theme';
import { Header } from '../../src/components/common/Header';
import { Card } from '../../src/components/common/Card';
import { BusinessPickerModal } from '../../src/components/common/BusinessPickerModal';
import { useAuth } from '../../src/features/auth';
import { useBusiness } from '../../src/features/business';
import { config } from '../../src/config';
import { formatDateIST } from '../../src/utils';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, isLoading: authLoading } = useAuth();
  const { currentBusiness } = useBusiness();
  const [pickerVisible, setPickerVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Header showBack title="Account & Organization" showBusinessPicker={false} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* User Hero */}
        <Card style={styles.userCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.full_name || 'Compliance Executive'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.authBadge}>
            <Ionicons name="shield-checkmark" size={12} color={theme.colors.success} />
            <Text style={styles.authBadgeText}>AUTHENTICATED USER</Text>
          </View>
        </Card>

        {/* Active Organization Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Entity</Text>
        </View>

        <Card style={styles.orgCard}>
          <View style={styles.orgRow}>
            <View style={styles.orgIcon}>
              <Ionicons name="business" size={22} color={theme.colors.teal} />
            </View>
            <View style={styles.orgInfo}>
              <Text style={styles.orgName}>{currentBusiness?.name || 'No Organization Selected'}</Text>
              <Text style={styles.orgMeta}>
                {currentBusiness?.state || 'Jurisdiction not set'} · {currentBusiness?.industry || 'General Industry'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.switchBtn}
              onPress={() => setPickerVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="swap-horizontal" size={16} color={theme.colors.teal} />
              <Text style={styles.switchBtnText}>Switch Business</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.newBizBtn}
              onPress={() => router.push('/(onboarding)/setup?mode=new')}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={16} color={theme.colors.teal} />
              <Text style={styles.newBizBtnText}>New Setup</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Security & System Info */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Security & Architecture</Text>
        </View>

        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Token Storage</Text>
            <Text style={styles.infoValue}>Android Keystore (Hardware Encrypted)</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Backend API</Text>
            <Text style={styles.infoValueMono} numberOfLines={1}>
              {config.apiBaseUrl}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Member Since</Text>
            <Text style={styles.infoValue}>
              {user?.date_joined ? formatDateIST(user.date_joined) : 'N/A'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Engine Specification</Text>
            <Text style={styles.infoValue}>Deterministic AST Engine v2.0</Text>
          </View>
        </Card>

        {/* Logout Action */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={logout}
          disabled={authLoading}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
          <Text style={styles.logoutBtnText}>
            {authLoading ? 'Signing out...' : 'Sign Out of ComplyWise'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <BusinessPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  userCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.teal,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  avatarLargeText: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: '#FFFFFF',
  },
  userName: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  userEmail: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  authBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.successLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.round,
    marginTop: theme.spacing.sm,
  },
  authBadgeText: {
    fontSize: 9,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.success,
  },
  sectionHeader: {
    marginBottom: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orgCard: {
    marginBottom: theme.spacing.md,
  },
  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orgIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0FDFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orgInfo: {
    flex: 1,
  },
  orgName: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  orgMeta: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
    marginVertical: theme.spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  switchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  switchBtnText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.tealDark,
  },
  newBizBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  newBizBtnText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  infoCard: {
    marginBottom: theme.spacing.lg,
  },
  infoRow: {
    paddingVertical: 2,
  },
  infoLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    fontWeight: theme.typography.weights.medium,
  },
  infoValue: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  infoValueMono: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: theme.colors.tealDark,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.danger,
    borderRadius: theme.borderRadius.sm,
    height: 48,
    marginBottom: theme.spacing.xxl,
  },
  logoutBtnText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
  },
});
