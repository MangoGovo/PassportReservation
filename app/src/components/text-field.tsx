import type { ComponentType, ReactNode } from 'react';
import { Text, TextInput, View } from 'react-native';

import { colors, spacing, typography } from '@/src/theme';

type FieldIcon = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export function TextField({
  label,
  required,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  multiline,
  prefix,
  leftIcon: LeftIcon,
  rightAction,
  labelRight,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  secureTextEntry?: boolean;
  multiline?: boolean;
  prefix?: string;
  leftIcon?: FieldIcon;
  rightAction?: ReactNode;
  labelRight?: ReactNode;
}) {
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text selectable style={{ ...typography.labelBold, color: colors.onSurface }}>
          {label}
          {required ? <Text style={{ color: colors.error }}> *</Text> : null}
        </Text>
        {labelRight}
      </View>
      <View
        style={{
          minHeight: multiline ? 96 : 48,
          borderWidth: 1,
          borderColor: colors.outlineVariant,
          borderRadius: 8,
          backgroundColor: colors.surfaceContainerLowest,
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          overflow: 'hidden',
        }}
      >
        {prefix ? (
          <View
            style={{
              height: '100%',
              paddingHorizontal: spacing.md,
              alignItems: 'center',
              justifyContent: 'center',
              borderRightWidth: 1,
              borderColor: colors.outlineVariant,
              backgroundColor: colors.surfaceContainerLow,
            }}
          >
            <Text selectable style={{ ...typography.bodyMd, color: colors.onSurfaceVariant }}>
              {prefix}
            </Text>
          </View>
        ) : null}
        {LeftIcon ? (
          <View style={{ paddingLeft: spacing.md, paddingTop: multiline ? spacing.md : 0 }}>
            <LeftIcon size={18} color={colors.outline} />
          </View>
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.outline}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          style={{
            flex: 1,
            minHeight: multiline ? 96 : 48,
            paddingHorizontal: spacing.md,
            paddingVertical: multiline ? spacing.md : 0,
            color: colors.onSurface,
            ...typography.bodyMd,
          }}
        />
        {rightAction ? <View style={{ paddingRight: spacing.md }}>{rightAction}</View> : null}
      </View>
    </View>
  );
}
