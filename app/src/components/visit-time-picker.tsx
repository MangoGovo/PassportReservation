import { CalendarDays, Check, ChevronDown, Clock } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Card } from '@/src/components/card';
import { colors, spacing, typography } from '@/src/theme';

export function VisitTimePicker({
  label,
  required,
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const dateOptions = useMemo(() => nextSevenDays(), []);
  const fallbackDate = useMemo(() => dateOptions[0]?.value ?? '', [dateOptions]);
  const [draftDate, setDraftDate] = useState(fallbackDate);

  const openPicker = () => {
    const nextDate = value ? value.slice(0, 10) : fallbackDate;
    setDraftDate(nextDate);
    setOpen(true);
  };

  const confirm = () => {
    if (!draftDate) {
      return;
    }
    onChange(`${draftDate}T00:00:00`);
    setOpen(false);
  };

  return (
    <View style={{ gap: 6 }}>
      <Text selectable style={{ ...typography.labelBold, color: colors.onSurface }}>
        {label}
        {required ? <Text style={{ color: colors.error }}> *</Text> : null}
      </Text>
      <Pressable
        onPress={openPicker}
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
          gap: spacing.sm,
        })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
          <Clock size={18} color={value ? colors.primary : colors.outline} />
          <Text selectable style={{ ...typography.bodyMd, color: value ? colors.onSurface : colors.outline }}>
            {value ? formatSelected(value) : '请选择进校日期'}
          </Text>
        </View>
        <ChevronDown size={20} color={colors.outline} />
      </Pressable>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.32)',
            justifyContent: 'center',
            padding: spacing.lg,
          }}
        >
          <Pressable
            onPress={() => setOpen(false)}
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
          />
          <Card style={{ gap: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <CalendarDays size={20} color={colors.primary} />
              <Text selectable style={{ ...typography.bodyLgStrong, color: colors.onSurface }}>
                选择预约进校日期
              </Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {dateOptions.map((option) => {
                  const active = option.value === draftDate;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setDraftDate(option.value)}
                      style={{
                        width: 72,
                        minHeight: 64,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: active ? colors.primary : colors.outlineVariant,
                        backgroundColor: active ? colors.primaryFixed : colors.surfaceContainerLowest,
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                      }}
                    >
                      <Text selectable style={{ ...typography.labelBold, color: active ? colors.primary : colors.onSurface }}>
                        {option.title}
                      </Text>
                      <Text selectable style={{ ...typography.label, color: colors.onSurfaceVariant }}>
                        {option.weekday}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <View
              style={{
                minHeight: 48,
                borderRadius: 8,
                backgroundColor: colors.primaryFixed,
                paddingHorizontal: spacing.md,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.sm,
              }}
            >
              <Check size={16} color={colors.primary} />
              <Text selectable style={{ ...typography.bodyMdStrong, color: colors.primary }}>
                全天可预约
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Pressable
                onPress={() => setOpen(false)}
                style={{
                  flex: 1,
                  minHeight: 44,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.outlineVariant,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text selectable style={{ ...typography.bodyMdStrong, color: colors.onSurfaceVariant }}>
                  取消
                </Text>
              </Pressable>
              <Pressable
                disabled={!draftDate}
                onPress={confirm}
                style={{
                  flex: 1,
                  minHeight: 44,
                  borderRadius: 8,
                  backgroundColor: colors.primary,
                  opacity: !draftDate ? 0.42 : 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text selectable style={{ ...typography.bodyMdStrong, color: colors.onPrimary }}>
                  确定
                </Text>
              </Pressable>
            </View>
          </Card>
        </View>
      </Modal>
    </View>
  );
}

function nextSevenDays() {
  return Array.from({ length: 7 }, (_, offset) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    const value = formatDate(date);
    return {
      value,
      title: offset === 0 ? '今天' : offset === 1 ? '明天' : `${date.getMonth() + 1}/${date.getDate()}`,
      weekday: weekdayLabel(date),
    };
  });
}

function formatSelected(value: string) {
  const date = value.slice(0, 10);
  return `${date} 全天`;
}

function formatDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function weekdayLabel(date: Date) {
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}
