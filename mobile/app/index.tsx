/**
 * ComplyWise Mobile - Root Route Dispatcher
 *
 * Redirects dynamically to (app) or (auth)/signin based on session state.
 */

import { Redirect } from 'expo-router';
import { useAuth } from '../src/features/auth';

export default function RootIndex() {
  const { status, isAuthenticated } = useAuth();

  if (status === 'INITIALIZING') {
    return null;
  }

  return <Redirect href={isAuthenticated ? '/(app)' : '/(auth)/signin'} />;
}
