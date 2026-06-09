import { CalendarPlus, ChevronRight, ClipboardList, QrCode, RefreshCw } from 'lucide-react-native';
import { Link, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import type { ViewStyle } from 'react-native';

import { BottomTabs } from '@/src/components/bottom-tabs';
import { Card } from '@/src/components/card';
import { PrimaryButton } from '@/src/components/primary-button';
import { ScreenContainer } from '@/src/components/screen-container';
import { StatusChip } from '@/src/components/status-chip';
import { TopBar } from '@/src/components/top-bar';
import { listMyReservations } from '@/src/services/api';
import { colors, spacing, typography } from '@/src/theme';
import type { ReservationSummary } from '@/src/types';

export default function ReservationsScreen() {
  const router = useRouter();
  const [results, setResults] = useState<ReservationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setResults(await listMyReservations());
    } catch (requestError) {
      setResults([]);
      setError(requestError instanceof Error ? requestError.message : '预约记录加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <TopBar title="校园通行码" />
      <ScreenContainer bottom={<BottomTabs active="home" />}>
        <Card style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <ClipboardList size={20} color={colors.primary} />
            <Text selectable style={{ ...typography.bodyLgStrong, color: colors.primary }}>
              我的预约
            </Text>
          </View>
          <Text selectable style={{ ...typography.bodyMd, color: colors.onSurfaceVariant }}>
            这里展示当前登录账号提交过的预约记录。
          </Text>
          <PrimaryButton
            label="新增预约"
            onPress={() => router.push('/reserve')}
            leftIcon={<CalendarPlus size={18} color={colors.onPrimary} />}
          />
        </Card>

        {loading ? <ReservationListSkeleton /> : null}

        {!loading && error ? (
          <Card style={{ gap: spacing.md, alignItems: 'center' }}>
            <Text selectable style={{ ...typography.bodyLgStrong, color: colors.onSurface }}>
              预约记录加载失败
            </Text>
            <Text selectable style={{ ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' }}>
              {error}
            </Text>
            <PrimaryButton label="重新加载" onPress={load} leftIcon={<RefreshCw size={18} color={colors.onPrimary} />} />
          </Card>
        ) : null}

        {!loading && !error && results.length ? (
          <View style={{ gap: spacing.md }}>
            <Text selectable style={{ ...typography.labelBold, color: colors.outline }}>
              预约记录
            </Text>
            {results.map((item) => (
              <ReservationCard key={item.id} item={item} />
            ))}
          </View>
        ) : null}

        {!loading && !error && !results.length ? (
          <Card style={{ gap: spacing.md, alignItems: 'center' }}>
            <CalendarPlus size={34} color={colors.primary} />
            <Text selectable style={{ ...typography.bodyLgStrong, color: colors.onSurface }}>
              暂无预约记录
            </Text>
            <Text selectable style={{ ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' }}>
              提交预约后，会直接在这里看到当前账号的预约状态。
            </Text>
            <PrimaryButton label="去预约" onPress={() => router.push('/reserve')} />
          </Card>
        ) : null}
      </ScreenContainer>
    </>
  );
}

function ReservationCard({ item }: { item: ReservationSummary }) {
  const canViewPass = item.status === 'AUTO_APPROVED' || item.status === 'APPROVED';
  const borderColor =
    item.status === 'REJECTED'
      ? colors.error
      : item.status === 'PENDING'
        ? colors.warning
        : colors.secondary;

  const action = (
    <View
      style={{
        height: 40,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: canViewPass ? colors.primary : colors.outlineVariant,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 6,
      }}
    >
      <Text selectable style={{ ...typography.bodyMdStrong, color: canViewPass ? colors.primary : colors.onSurfaceVariant }}>
        {canViewPass ? '查看通行码' : '查看状态'}
      </Text>
      {canViewPass ? <QrCode size={16} color={colors.primary} /> : <ChevronRight size={16} color={colors.onSurfaceVariant} />}
    </View>
  );

  return (
    <Card style={{ gap: spacing.md, borderLeftWidth: 4, borderLeftColor: borderColor }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text selectable style={{ ...typography.bodyMd, color: colors.onSurfaceVariant }}>
            申请日期: {item.applyDate}
          </Text>
          <Text selectable style={{ ...typography.bodyLgStrong, color: colors.onSurface }}>
            进校: {item.visitDate}
          </Text>
        </View>
        <StatusChip status={item.status} />
      </View>

      <View
        style={{
          flexDirection: 'row',
          gap: spacing.xl,
          backgroundColor: colors.surfaceContainerLow,
          borderRadius: 8,
          padding: spacing.sm,
        }}
      >
        <Meta label="校区" value={item.campus} />
        <View style={{ width: 1, backgroundColor: colors.outlineVariant }} />
        <Meta label="类型" value={item.typeLabel} />
      </View>

      {canViewPass ? (
        <Link href={`/pass/${item.id}`} asChild>
          <Pressable>{action}</Pressable>
        </Link>
      ) : (
        <Pressable onPress={() => Alert.alert('预约状态', `${item.typeLabel}：${item.statusLabel}`)}>{action}</Pressable>
      )}
    </Card>
  );
}

function ReservationListSkeleton() {
  return (
    <View style={{ gap: spacing.md }}>
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
            <View style={{ flex: 1, gap: spacing.sm }}>
              <SkeletonBlock style={{ width: '46%', height: 16 }} />
              <SkeletonBlock style={{ width: '64%', height: 22 }} />
            </View>
            <SkeletonBlock style={{ width: 64, height: 24, borderRadius: 4 }} />
          </View>
          <SkeletonBlock style={{ height: 48 }} />
          <SkeletonBlock style={{ height: 40 }} />
        </Card>
      ))}
    </View>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text selectable style={{ ...typography.labelBold, color: colors.outline }}>
        {label}
      </Text>
      <Text selectable style={{ ...typography.bodyMdStrong, color: colors.onSurface }}>
        {value}
      </Text>
    </View>
  );
}

function SkeletonBlock({ style }: { style: ViewStyle }) {
  return <View style={{ backgroundColor: colors.surfaceContainerHigh, borderRadius: 8, opacity: 0.9, ...style }} />;
}
