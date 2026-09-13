/**
 * Business Selector & Creation Modal
 * Authority: TRD_v2.0 §31, §32
 */

import { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { useBusiness } from '../../features/business';

interface BusinessPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onBusinessCreated?: (businessId: string) => void;
}

export function BusinessPickerModal({
  visible,
  onClose,
  onBusinessCreated,
}: BusinessPickerModalProps) {
  const { businesses, currentBusiness, selectBusiness, createBusiness } = useBusiness();
  const [isCreating, setIsCreating] = useState(false);
  const [newBizName, setNewBizName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSelect = async (id: string) => {
    await selectBusiness(id);
    onClose();
  };

  const handleCreate = async () => {
    const trimmed = newBizName.trim();
    if (!trimmed) {
      setError('Business name cannot be empty');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const created = await createBusiness(trimmed);
      setNewBizName('');
      setIsCreating(false);
      onClose();
      if (onBusinessCreated) {
        onBusinessCreated(created.id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create business');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Switch Organization</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* List of businesses */}
          <FlatList
            data={businesses}
            keyExtractor={(item) => item.id}
            style={styles.list}
            renderItem={({ item }) => {
              const isSelected = item.id === currentBusiness?.id;
              return (
                <TouchableOpacity
                  style={[styles.item, isSelected && styles.itemSelected]}
                  onPress={() => handleSelect(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconCircle}>
                    <Ionicons
                      name="business"
                      size={18}
                      color={isSelected ? theme.colors.teal : theme.colors.textMuted}
                    />
                  </View>
                  <View style={styles.itemContent}>
                    <Text style={[styles.itemTitle, isSelected && styles.itemTitleSelected]}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemMeta}>
                      {item.state ? `${item.state} · ` : ''}
                      {item.industry || 'General Industry'}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.teal} />
                  )}
                </TouchableOpacity>
              );
            }}
          />

          {/* Add Business section */}
          {isCreating ? (
            <View style={styles.createBox}>
              <Text style={styles.createLabel}>New Business Name</Text>
              <TextInput
                style={styles.input}
                value={newBizName}
                onChangeText={setNewBizName}
                placeholder="e.g. Apex Industrial Works"
                placeholderTextColor={theme.colors.textSubtle}
                autoFocus
              />
              {error && <Text style={styles.errorText}>{error}</Text>}
              <View style={styles.createBtnRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setIsCreating(false);
                    setError(null);
                  }}
                  disabled={submitting}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleCreate}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>Create Business</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setIsCreating(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={20} color={theme.colors.teal} />
              <Text style={styles.addBtnText}>Add Another Business</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  list: {
    marginBottom: theme.spacing.md,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
  },
  itemSelected: {
    borderColor: theme.colors.teal,
    backgroundColor: '#F0FDFA',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  itemTitleSelected: {
    color: theme.colors.tealDark,
  },
  itemMeta: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  addBtnText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.teal,
  },
  createBox: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
  },
  createLabel: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    height: 44,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textPrimary,
    backgroundColor: '#FFFFFF',
    marginBottom: theme.spacing.xs,
  },
  errorText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.danger,
    marginBottom: theme.spacing.xs,
  },
  createBtnRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  cancelBtn: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelBtnText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
  },
  submitBtn: {
    flex: 2,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.teal,
  },
  submitBtnText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: '#FFFFFF',
  },
});
