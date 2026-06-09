import { ChevronRight, QrCode, Search } from 'lucide-react-native';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { BottomTabs } from '@/src/components/bottom-tabs';
import { Card } from '@/src/components/card';
import { PrimaryButton } from '@/src/components/primary-button';
import { ScreenContainer } from '@/src/components/screen-container';
import { StatusChip } from '@/src/components/status-chip';
import { TextField } from '@/src/components/text-field';
import { TopBar } from '@/src/components/top-bar';
import { queryReservations } from '@/src/services/api';
import { colors, spacing, typography } from '@/src/theme';
import type { ReservationSummary } from '@/src/types';

export default function ReservationsScreen() {
  const [name, setName] = useState('');
  const [idCard, setIdCard] = useState('');
  const [mobile, setMobile] = useState('');
  const [results, setResults] = useState<ReservationSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    setLoading(true);
    try {
      setResults(await queryReservations({ name, idCard, mobile }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TopBar title="校园通行码" />
      <ScreenContainer bottom={<BottomTabs active="home" />}>
        <Card style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Search size={20} color={colors.primary} />
            <Text selectable style={{ ...typography.bodyLgStrong, color: colors.primary }}>
              预约查询
            </Text>
          </View>
          <TextField label="姓名" value={name} onChangeText={setName} placeholder="请输入真实姓名" />
          <TextField label="身份证号" value={idCard} onChangeText={setIdCard} placeholder="请输入身份证号" />
          <TextField label="手机号" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" placeholder="请输入手机号" />
          <PrimaryButton
            label="查询记录"
            onPress={search}
            loading={loading}
            leftIcon={<Search size={18} color={colors.onPrimary} />}
          />
        </Card>

        <View style={{ gap: spacing.md }}>
          <Text selectable style={{ ...typography.labelBold, color: colors.outline }}>
            查询结果
          </Text>
          {(results.length ? results : []).map((item) => (
            <ReservationCard key={item.id} item={item} />
          ))}
          {!results.length ? (
            <Text selectable style={{ ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' }}>
              输入信息后点击查询记录
            </Text>
          ) : null}
        </View>
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
        {canViewPass ? '查看通行码' : '查看详情'}
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
        <Pressable onPress={() => Alert.alert('预约详情', `${item.typeLabel}：${item.statusLabel}`)}>{action}</Pressable>
      )}
    </Card>
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
