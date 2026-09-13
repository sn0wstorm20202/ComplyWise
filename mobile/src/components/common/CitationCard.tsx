/**
 * Statutory Evidence Citation Card
 * Authority: PRD_v2.0 §P5, TRD_v2.0 §4
 */

import { StyleSheet, Text, View, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { StatutoryEvidenceItem } from '../../types/compliance';

interface CitationCardProps {
  citation: StatutoryEvidenceItem | {
    evidence_id: string;
    source_title: string;
    authority: string;
    locator: string;
    excerpt: string;
    verification_status: string;
    canonical_url?: string;
  };
}

export function CitationCard({ citation }: CitationCardProps) {
  const handleOpenUrl = () => {
    if (citation.canonical_url) {
      Linking.openURL(citation.canonical_url).catch(() => {});
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.authorityPill}>
          <Text style={styles.authorityText}>{citation.authority || 'AUTHORITY'}</Text>
        </View>
        <View style={styles.statusPill}>
          <Ionicons
            name={citation.verification_status === 'VERIFIED' ? 'checkmark-circle' : 'time-outline'}
            size={12}
            color={citation.verification_status === 'VERIFIED' ? theme.colors.success : theme.colors.accentDark}
          />
          <Text
            style={[
              styles.statusText,
              citation.verification_status === 'VERIFIED'
                ? styles.statusVerified
                : styles.statusPending,
            ]}
          >
            {citation.verification_status || 'RECORDED'}
          </Text>
        </View>
      </View>

      <Text style={styles.sourceTitle}>{citation.source_title}</Text>

      {citation.locator ? (
        <View style={styles.locatorRow}>
          <Ionicons name="document-text-outline" size={13} color={theme.colors.teal} />
          <Text style={styles.locatorText}>Section / Rule: {citation.locator}</Text>
        </View>
      ) : null}

      {citation.excerpt ? (
        <View style={styles.excerptBox}>
          <Text style={styles.excerptText}>"{citation.excerpt}"</Text>
        </View>
      ) : null}

      {citation.canonical_url ? (
        <TouchableOpacity style={styles.linkRow} onPress={handleOpenUrl} activeOpacity={0.7}>
          <Ionicons name="link-outline" size={13} color={theme.colors.teal} />
          <Text style={styles.linkText} numberOfLines={1}>
            {citation.canonical_url}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  authorityPill: {
    backgroundColor: '#EEF2F6',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.xs,
  },
  authorityText: {
    fontSize: theme.typography.sizes.xxs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statusText: {
    fontSize: theme.typography.sizes.xxs,
    fontWeight: theme.typography.weights.semibold,
  },
  statusVerified: {
    color: theme.colors.success,
  },
  statusPending: {
    color: theme.colors.accentDark,
  },
  sourceTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xxs,
  },
  locatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: theme.spacing.xs,
  },
  locatorText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.tealDark,
    fontWeight: theme.typography.weights.medium,
  },
  excerptBox: {
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.teal,
    paddingLeft: theme.spacing.sm,
    marginVertical: theme.spacing.xs,
  },
  excerptText: {
    fontSize: theme.typography.sizes.xs,
    fontStyle: 'italic',
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.lineHeights.normal,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: theme.spacing.xs,
  },
  linkText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.teal,
    textDecorationLine: 'underline',
    flex: 1,
  },
});
