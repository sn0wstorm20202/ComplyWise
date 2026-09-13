/**
 * Executive Top Header (Light Theme)
 *
 * Direct structural inspiration from Figma:
 * `ui layers/Compliance Overview Dashboard - Refined.png` & `Compliance - ComplyWise.png`
 * adapted into an Executive Light Theme.
 */

import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBusiness } from '../../features/business';
import { useAuth } from '../../features/auth';
import { BusinessPickerModal } from './BusinessPickerModal';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showBusinessPicker?: boolean;
}

export function Header({
  title,
  showBack = false,
  showBusinessPicker = true,
}: HeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentBusiness } = useBusiness();
  const { user } = useAuth();
  const [pickerVisible, setPickerVisible] = useState(false);

  // Guarantee comfortable top clearance across all Android camera cutouts and iOS notches
  const topPadding = Math.max(insets.top, 16);
  const containerHeight = 56 + topPadding;

  const handleNotificationPress = () => {
    Alert.alert(
      'Regulatory Notifications',
      'All compliance deadlines and statutory filings are currently synchronized.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding, height: containerHeight }]}>
      {/* Left: Back Button or Shield Mark */}
      <View style={styles.leftRow}>
        {showBack ? (
          <TouchableOpacity
            style={styles.circleButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.circleButton}
            onPress={() => router.push('/(app)/(tabs)')}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Dashboard Home"
          >
            <Ionicons name="shield-checkmark-outline" size={20} color="#0284C7" />
          </TouchableOpacity>
        )}
      </View>

      {/* Center: Title or Business Quick Switcher */}
      <View style={styles.centerContainer}>
        {title ? (
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
        ) : showBusinessPicker && currentBusiness ? (
          <TouchableOpacity
            style={styles.bizPill}
            onPress={() => setPickerVisible(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Switch active organization"
          >
            <View style={styles.bizDot} />
            <Text style={styles.bizPillText} numberOfLines={1}>
              {currentBusiness.name}
            </Text>
            <Ionicons name="chevron-down" size={12} color="#64748B" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Right: Notifications & Profile Avatar */}
      <View style={styles.rightRow}>
        <TouchableOpacity
          style={styles.bellButton}
          onPress={handleNotificationPress}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications-outline" size={21} color="#475569" />
          <View style={styles.unreadDot} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.avatarButton}
          onPress={() => router.push('/(app)/profile' as any)}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 8, right: 12 }}
          accessibilityLabel="Account and shop profile"
        >
          <Text style={styles.avatarText}>
            {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>

      <BusinessPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 100,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  bizPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    maxWidth: 200,
  },
  bizDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0284C7',
  },
  bizPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    maxWidth: 140,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0284C7',
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
