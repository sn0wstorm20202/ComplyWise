/**
 * ComplyWise Mobile - Canonical Route Identifier Constants
 *
 * Authority: Screen specifications (Screen 01 - 17)
 * Defines route path contracts for planned feature screens.
 */

export const Routes = {
  // Foundation / Entry
  Root: '/',

  // Auth Group (Upcoming)
  Auth: {
    Splash: '/(auth)/splash',
    SignIn: '/(auth)/signin',
    Register: '/(auth)/register',
  },

  // Onboarding Group (Upcoming)
  Onboarding: {
    BusinessSetup: '/(onboarding)/setup',
    BusinessProfile: '/(onboarding)/profile',
    SmartQuestions: '/(onboarding)/questions',
    Analysis: '/(onboarding)/analysis',
    Results: '/(onboarding)/results',
  },

  // Main Application Tabs / Screens (Upcoming)
  Main: {
    Dashboard: '/(main)/dashboard',
    Compliance: '/(main)/compliance',
    Actions: '/(main)/actions',
    Intelligence: '/(main)/intelligence',
    Assistant: '/(main)/assistant',
    Profile: '/(main)/profile',
  },
} as const;

export default Routes;
