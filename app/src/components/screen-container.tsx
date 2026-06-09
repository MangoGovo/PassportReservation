import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/src/theme';

export function ScreenContainer({
  children,
  bottom,
}: {
  children: ReactNode;
  bottom?: ReactNode;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: (bottom ? 92 : 28) + insets.bottom,
          gap: spacing.xl,
        }}
      >
        {children}
      </ScrollView>
      {bottom}
    </View>
  );
}
