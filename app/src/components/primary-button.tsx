import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { colors, shadows, typography } from '@/src/theme';

export function PrimaryButton({
  label,
  onPress,
  loading,
  variant = 'solid',
  leftIcon,
  rightIcon,
  roundedFull,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'solid' | 'outline';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  roundedFull?: boolean;
}) {
  const solid = variant === 'solid';

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => ({
        minHeight: 48,
        borderRadius: roundedFull ? 999 : 8,
        borderWidth: solid ? 0 : 1,
        borderColor: colors.outlineVariant,
        backgroundColor: solid ? colors.primary : colors.surfaceContainerLowest,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        opacity: pressed || loading ? 0.86 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
        ...(solid ? shadows.button : {}),
      })}
    >
      {loading ? (
        <ActivityIndicator color={solid ? colors.onPrimary : colors.primary} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {leftIcon}
          <Text selectable style={{ ...typography.headlineMd, color: solid ? colors.onPrimary : colors.primary }}>
            {label}
          </Text>
          {rightIcon}
        </View>
      )}
    </Pressable>
  );
}
