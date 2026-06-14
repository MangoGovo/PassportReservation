import { CalendarPlus, RefreshCw } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Card } from '@/src/components/card';
import { PassCard, PassCardSkeleton } from '@/src/components/pass-card';
import { PrimaryButton } from '@/src/components/primary-button';
import { SessionExpiredCard } from '@/src/components/session-expired-card';
import { getCurrentPass, isAuthExpiredError } from '@/src/services/api';
import { colors, spacing, typography } from '@/src/theme';
import type { PassDetail } from '@/src/types';

export function CurrentPassContent() {
  const router = useRouter();
  const [detail, setDetail] = useState<PassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authExpired, setAuthExpired] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setAuthExpired(false);
    try {
      setDetail(await getCurrentPass());
    } catch (requestError) {
      setDetail(null);
      if (isAuthExpiredError(requestError)) {
        setAuthExpired(true);
        return;
      }
      setError(requestError instanceof Error ? requestError.message : '通行码加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <PassCardSkeleton />;
  }

  if (authExpired) {
    return <SessionExpiredCard onLogin={() => router.push({ pathname: '/login', params: { redirect: '/pass' } })} />;
  }

  if (error) {
    return (
      <Card style={{ gap: spacing.md, alignItems: 'center' }}>
        <Text selectable style={{ ...typography.bodyLgStrong, color: colors.onSurface }}>
          通行码加载失败
        </Text>
        <Text selectable style={{ ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' }}>
          {error}
        </Text>
        <PrimaryButton label="重新加载" onPress={load} leftIcon={<RefreshCw size={18} color={colors.onPrimary} />} />
      </Card>
    );
  }

  if (detail) {
    return <PassCard detail={detail} />;
  }

  return (
    <Card style={{ gap: spacing.md, alignItems: 'center' }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.primaryFixed,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CalendarPlus size={30} color={colors.primary} />
      </View>
      <Text selectable style={{ ...typography.bodyLgStrong, color: colors.onSurface }}>
        暂无可展示的预约
      </Text>
      <Text selectable style={{ ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' }}>
        提交预约后，这里会展示同一个个人身份通行码和当前预约状态。
      </Text>
      <PrimaryButton label="去预约" onPress={() => router.push('/reserve')} />
    </Card>
  );
}
