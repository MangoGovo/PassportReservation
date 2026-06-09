import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { BottomTabs } from '@/src/components/bottom-tabs';
import { PassCard, PassCardSkeleton } from '@/src/components/pass-card';
import { ScreenContainer } from '@/src/components/screen-container';
import { TopBar } from '@/src/components/top-bar';
import { getPass } from '@/src/services/api';
import { colors, typography } from '@/src/theme';
import type { PassDetail } from '@/src/types';

export default function ReservationPassScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detail, setDetail] = useState<PassDetail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id || id === 'demo' || !/^\d+$/.test(id)) {
      setDetail(null);
      setError('请从“我的通行”或预约记录进入通行码页面。');
      return;
    }
    setError('');
    getPass(id)
      .then(setDetail)
      .catch((requestError) => {
        setDetail(null);
        setError(requestError instanceof Error ? requestError.message : '通行码加载失败');
      });
  }, [id]);

  return (
    <>
      <TopBar title="校园通行码" />
      <ScreenContainer bottom={<BottomTabs active="pass" />}>
        {error ? (
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
