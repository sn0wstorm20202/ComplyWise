import { Stack } from 'expo-router';
import { theme } from '../../src/theme';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: theme.typography.sizes.md,
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Stack.Screen
        name="setup"
        options={{
          title: 'Organization Setup',
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="questions"
        options={{
          title: 'Smart Questions',
        }}
      />
      <Stack.Screen
        name="analysis"
        options={{
          title: 'Evaluating Compliance',
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="results"
        options={{
          title: 'Assessment Overview',
          headerBackVisible: false,
        }}
      />
    </Stack>
  );
}
