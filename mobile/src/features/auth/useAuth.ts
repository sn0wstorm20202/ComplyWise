/**
 * ComplyWise Mobile - useAuth Hook
 * Primary UI-facing interface for authentication state and operations.
 */

import { useContext } from 'react';
import { AuthContext } from './AuthContext';
import { AuthContextValue } from './types';

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
}

export default useAuth;
