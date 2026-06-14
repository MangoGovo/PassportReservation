import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { BottomTabs } from '@/src/components/bottom-tabs';
import { PassCard, PassCardSkeleton } from '@/src/components/pass-card';
import { ScreenContainer } from '@/src/components/screen-container';
import { SessionExpiredCard } from '@/src/components/session-expired-card';
import { TopBar } from '@/src/components/top-bar';
import { getPass, isAuthExpiredError } from '@/src/services/api';
import { colors, typography } from '@/src/theme';
import type { PassDetail } from '@/src/types';

export default function ReservationPassScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detail, setDetail] = useState<PassDetail | null>(null);
  const [error, setError] = useState('');
  const [authExpired, setAuthExpired] = useState(false);

  useEffect(() => {
    if (!id || id === 'demo' || !/^\d+$/.test(id)) {
      setDetail(null);
      setError('请从“我的通行”或预约记录进入通行码页面。');
      setAuthExpired(false);
      return;
    }
    setError('');
    setAuthExpired(false);
    getPass(id)
      .then(setDetail)
      .catch((requestError) => {
        setDetail(null);
        if (isAuthExpiredError(requestError)) {
          setAuthExpired(true);
          return;
        }
        setError(requestError instanceof Error ? requestError.message : '通行码加载失败');
      });
  }, [id]);

  return (
    <>
      <TopBar title="校园通行码" />
      <ScreenContainer bottom={<BottomTabs active="pass" />}>
        {authExpired ? (
          <SessionExpiredCard onLogin={() => router.push({ pathname: '/login', params: { redirect: '/pass' } })} />
        ) : error ? (
          <Text selectable style={{ ...typography.bodyMd, color: colors.onSurfaceVariant }}>
            {error}
          </Text>
        ) : detail ? (
          <PassCard detail={detail} />
        ) : (
          <PassCardSkeleton />
        )}
      </ScreenContainer>
    </>
  );
}
