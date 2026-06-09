import { Stack } from 'expo-router';

import { colors, typography } from '@/src/theme';

export function TopBar({ title, back = true }: { title: string; back?: boolean }) {
  return (
    <Stack.Screen
      options={{
        title,
        headerBackVisible: back,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleAlign: 'center',
        headerTitleStyle: {
          color: colors.primary,
          fontSize: typography.headlineMd.fontSize,
          fontWeight: typography.headlineMd.fontWeight,
        },
      }}
    />
  );
}
