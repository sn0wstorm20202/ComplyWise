/**
 * ComplyWise Mobile - Encrypted Hardware-Backed Storage Abstraction
 *
 * Authority: TRD_v2.0 §30, §31, §61 (Client Data Security)
 *
 * Uses Expo SecureStore which encrypts data via the Android Keystore
 * and EncryptedSharedPreferences on Android devices.
 * Authentication tokens must NEVER be written to unencrypted AsyncStorage
 * or plain SQLite storage.
 */

import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'complywise_auth_token';

export const storage = {
  /**
   * Persist the authenticated session token into Android hardware-backed Keystore.
   */
  async saveAuthToken(token: string): Promise<void> {
    if (!token || typeof token !== 'string') {
      throw new Error('Cannot save empty or non-string auth token.');
    }
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token, {
      keychainAccessible: SecureStore.ALWAYS_THIS_DEVICE_ONLY,
    });
  },

  /**
   * Retrieve the active authentication token, or null if unauthenticated.
   */
  async getAuthToken(): Promise<string | null> {
    try {
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      return token || null;
    } catch {
      return null;
    }
  },

  /**
   * Securely wipe the active session token upon logout or session invalidation.
   */
  async clearAuthToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    } catch {
      // Deleting a non-existent key should not throw
    }
  },

  /**
   * Generic secure key-value setter for sensitive mobile preferences.
   */
  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },

  /**
   * Generic secure key-value getter.
   */
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },

  /**
   * Generic secure key deletion.
   */
  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Ignore removal of non-existent key
    }
  },
};

export default storage;
