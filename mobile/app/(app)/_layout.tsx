import { Stack } from 'expo-router';
import { theme } from '../../src/theme';

export default function AppLayout() {
  return (
    <Stack
      initialRouteName="(tabs)"
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="compliance/[id]"
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
    </Stack>
  );
}
