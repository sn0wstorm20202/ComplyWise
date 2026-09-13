/**
 * ComplyWise Mobile - Root Route Dispatcher
 *
 * Redirects dynamically to (app) or (auth)/signin based on session state.
 */

import { Redirect } from 'expo-router';
import { useAuth } from '../src/features/auth';
import { useBusiness } from '../src/features/business';

export default function RootIndex() {
  const { status, isAuthenticated } = useAuth();
  const { businesses, isLoaded: businessLoaded } = useBusiness();

  if (status === 'INITIALIZING' || (isAuthenticated && !businessLoaded)) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/signin" />;
  }

  if (businesses.length === 0) {
    return <Redirect href="/(onboarding)/setup" />;
  }

  return <Redirect href="/(app)" />;
}
