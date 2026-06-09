import { CalendarDays, Clock, LocateFixed, Ticket, UserRound } from 'lucide-react-native';
import { useMemo } from 'react';
import { Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { ViewStyle } from 'react-native';

import { Card } from '@/src/components/card';
import { PassQr } from '@/src/components/pass-qr';
import { colors, spacing, typography } from '@/src/theme';
import type { PassDetail } from '@/src/types';

export function PassCard({ detail }: { detail: PassDetail }) {
  const statusMeta = useMemo(() => passStatusMeta(detail.passStatus), [detail.passStatus]);

  return (
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
        <PassQr color={statusMeta.color} disabled={detail.passStatus !== 'VALID'} imageUri={detail.qrBase64} />
        <Text selectable style={{ ...typography.bodyMdStrong, color: statusMeta.color, textAlign: 'center' }}>
          {statusMeta.label}
        </Text>
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
        <DetailRow icon={Ticket} label="预约编号" value={detail.reservationNo} />
        <DetailRow icon={UserRound} label="预约类型" value={detail.typeLabel} />
        <DetailRow icon={LocateFixed} label="预约校区" value={detail.campusGate} />
        <DetailRow icon={CalendarDays} label="进校日期" value={detail.visitDate} />
        <DetailRow icon={Clock} label="有效时间" value={detail.validTime} valueColor={statusMeta.color} strong />
      </View>
    </Card>
  );
}

export function PassCardSkeleton() {
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
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
        <SkeletonBlock style={{ width: 48, height: 48, borderRadius: 24 }} />
        <View style={{ flex: 1, gap: spacing.sm }}>
          <SkeletonBlock style={{ width: '46%', height: 24 }} />
          <SkeletonBlock style={{ width: '74%', height: 16 }} />
        </View>
        <SkeletonBlock style={{ width: 38, height: 24, borderRadius: 4 }} />
      </View>

      <View style={{ padding: 28, alignItems: 'center', backgroundColor: '#ffffff', gap: spacing.md }}>
        <SkeletonBlock style={{ width: 212, height: 212, borderRadius: 12 }} />
        <SkeletonBlock style={{ width: 132, height: 18 }} />
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
        {Array.from({ length: 5 }).map((_, index) => (
          <View
            key={index}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              gap: spacing.md,
              alignItems: 'center',
            }}
          >
            <SkeletonBlock style={{ width: 84, height: 18 }} />
            <SkeletonBlock style={{ width: index === 0 ? 128 : 96, height: 18 }} />
          </View>
        ))}
      </View>
    </Card>
  );
}

function passStatusMeta(status: PassDetail['passStatus']) {
  if (status === 'VALID') {
    return {
      label: '状态：有效通行',
      color: colors.passValid,
      light: colors.passValidLight,
    };
  }
  if (status === 'PENDING') {
    return {
      label: '状态：待审核',
      color: colors.warning,
      light: colors.warningLight,
    };
  }
  if (status === 'REJECTED') {
    return {
      label: '状态：审核未通过',
      color: colors.error,
      light: colors.errorContainer,
    };
  }
  return {
    label: status === 'NOT_YET' ? '状态：未到预约日期' : '状态：预约已过期',
    color: colors.passInvalid,
    light: colors.passInvalidLight,
  };
}

function SkeletonBlock({ style }: { style: ViewStyle }) {
  return <View style={{ backgroundColor: colors.surfaceContainerHigh, borderRadius: 8, opacity: 0.9, ...style }} />;
}

function DetailRow({
  icon: Icon,
  label,
  value,
  valueColor = colors.onSurface,
  strong,
}: {
  icon: LucideIcon;
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
      <Text selectable style={{ ...(strong ? typography.bodyLgStrong : typography.bodyLg), color: valueColor, flexShrink: 1, textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  );
}
