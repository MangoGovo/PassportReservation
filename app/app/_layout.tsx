import 'react-native-gesture-handler';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { colors, typography } from '@/src/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.primary,
          headerTitleAlign: 'center',
          headerTitleStyle: {
            color: colors.primary,
            fontSize: typography.headlineMd.fontSize,
            fontWeight: typography.headlineMd.fontWeight,
          },
          contentStyle: { backgroundColor: colors.surface },
        }}
      />
    </GestureHandlerRootView>
  );
}
