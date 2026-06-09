import { CalendarDays, Clock, History, LocateFixed, RefreshCw, UserRound } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { BottomTabs } from '@/src/components/bottom-tabs';
import { Card } from '@/src/components/card';
import { PassQr } from '@/src/components/pass-qr';
import { PrimaryButton } from '@/src/components/primary-button';
import { ScreenContainer } from '@/src/components/screen-container';
import { TopBar } from '@/src/components/top-bar';
import { getPass } from '@/src/services/api';
import { colors, spacing, typography } from '@/src/theme';
import type { PassDetail } from '@/src/types';

export default function PassScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detail, setDetail] = useState<PassDetail | null>(null);

  useEffect(() => {
    getPass(id ?? 'demo').then(setDetail);
  }, [id]);

  const statusMeta = useMemo(() => {
    if (!detail || detail.passStatus === 'VALID') {
      return {
        label: '状态：有效通行',
        color: colors.passValid,
        light: colors.passValidLight,
        note: '动态刷新中，请勿截图',
      };
    }
    if (detail.passStatus === 'PENDING') {
      return { label: '状态：待审核', color: colors.warning, light: colors.warningLight, note: '审核通过后生成通行码' };
    }
    if (detail.passStatus === 'REJECTED') {
      return { label: '状态：审核未通过', color: colors.error, light: colors.errorContainer, note: '该预约不可生成有效通行码' };
    }
    return { label: detail.passStatus === 'NOT_YET' ? '状态：未到预约日期' : '状态：预约已过期', color: colors.passInvalid, light: colors.passInvalidLight, note: '当前通行码不可使用' };
  }, [detail]);

  if (!detail) {
    return (
      <>
        <TopBar title="校园通行码" />
        <ScreenContainer>
          <Text selectable style={{ ...typography.bodyMd, color: colors.onSurfaceVariant }}>
            正在加载通行码...
          </Text>
        </ScreenContainer>
      </>
    );
  }

  return (
    <>
      <TopBar title="校园通行码" />
      <ScreenContainer bottom={<BottomTabs active="pass" />}>
        <View
          style={{
            borderRadius: 8,
            padding: spacing.md,
            backgroundColor: statusMeta.light,
            borderWidth: 1,
            borderColor: statusMeta.color,
            alignItems: 'center',
          }}
        >
          <Text selectable style={{ ...typography.bodyLgStrong, color: statusMeta.color }}>
            {statusMeta.label}
          </Text>
        </View>

        <Card style={{ padding: 0, overflow: 'hidden', borderWidth: 2, borderColor: statusMeta.color }}>
          <View
            style={{
              padding: spacing.lg,
              backgroundColor: colors.surfaceContainerLow,
              borderBottomWidth: 1,
              borderColor: colors.outlineVariant,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.primaryContainer,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text selectable style={{ ...typography.headlineMd, color: colors.onPrimary }}>
                {detail.avatarText}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text selectable style={{ ...typography.headlineMd, color: colors.onSurface }}>
                {detail.nameMasked}
              </Text>
              <Text selectable style={{ ...typography.bodyMd, color: colors.onSurfaceVariant }}>
                身份证: {detail.idCardMasked}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: statusMeta.light,
                paddingHorizontal: spacing.sm,
                paddingVertical: 4,
                borderRadius: 4,
              }}
            >
              <Text selectable style={{ ...typography.labelBold, color: statusMeta.color }}>
                访客
              </Text>
            </View>
          </View>

          <View style={{ padding: 28, alignItems: 'center', backgroundColor: '#ffffff', gap: spacing.md }}>
            <PassQr color={statusMeta.color} disabled={detail.passStatus !== 'VALID'} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={16} color={colors.onSurfaceVariant} />
              <Text selectable style={{ ...typography.bodyMd, color: colors.onSurfaceVariant }}>
                {statusMeta.note}
              </Text>
            </View>
          </View>

          <View
            style={{
              padding: spacing.lg,
              borderTopWidth: 1,
              borderStyle: 'dashed',
              borderColor: colors.outlineVariant,
              gap: spacing.md,
            }}
          >
            <DetailRow icon={LocateFixed} label="预约校区" value={detail.campusGate} />
            <DetailRow icon={CalendarDays} label="进校日期" value={detail.visitDate} />
            <DetailRow icon={Clock} label="有效时间" value={detail.validTime} valueColor={statusMeta.color} strong />
          </View>
        </Card>

        <PrimaryButton label="查看通行记录" onPress={() => {}} leftIcon={<History size={18} color={colors.onPrimary} />} />
      </ScreenContainer>
    </>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  valueColor = colors.onSurface,
  strong,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
  valueColor?: string;
  strong?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Icon size={18} color={colors.onSurfaceVariant} />
        <Text selectable style={{ ...typography.bodyMd, color: colors.onSurfaceVariant }}>
          {label}
        </Text>
      </View>
      <Text selectable style={{ ...(strong ? typography.bodyLgStrong : typography.bodyLg), color: valueColor }}>
        {value}
      </Text>
    </View>
  );
}
