import { ChevronDown } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { Card } from '@/src/components/card';
import { colors, spacing, typography } from '@/src/theme';

type Option = {
  label: string;
  value: string;
};

export function SelectField({
  label,
  required,
  value,
  options,
  onChange,
}: {
  label: string;
  required?: boolean;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => options.find((option) => option.value === value) ?? options[0], [options, value]);

  return (
    <View style={{ gap: 6 }}>
      <Text selectable style={{ ...typography.labelBold, color: colors.onSurface }}>
        {label}
        {required ? <Text style={{ color: colors.error }}> *</Text> : null}
      </Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({
          minHeight: 48,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: colors.outlineVariant,
          backgroundColor: pressed ? colors.surfaceContainerLow : colors.surfaceContainerLowest,
          paddingHorizontal: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        })}
      >
        <Text selectable style={{ ...typography.bodyMd, color: value ? colors.onSurface : colors.outline }}>
          {selected.label}
        </Text>
        <ChevronDown size={20} color={colors.outline} />
      </Pressable>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.32)',
            justifyContent: 'center',
            padding: spacing.lg,
          }}
        >
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {options.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                style={({ pressed }) => ({
                  minHeight: 52,
                  paddingHorizontal: spacing.lg,
                  justifyContent: 'center',
                  backgroundColor: pressed || option.value === value ? colors.surfaceContainerLow : colors.surfaceContainerLowest,
                  borderBottomWidth: 1,
                  borderColor: colors.outlineVariant,
                })}
              >
                <Text selectable style={{ ...typography.bodyLg, color: option.value === value ? colors.primary : colors.onSurface }}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </Card>
        </Pressable>
      </Modal>
    </View>
  );
}
