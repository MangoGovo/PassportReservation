import { Text, View } from 'react-native';

import { colors, typography } from '@/src/theme';
import type { ReviewStatus } from '@/src/types';

const statusMap: Record<ReviewStatus, { label: string; color: string; background: string }> = {
  AUTO_APPROVED: {
    label: '自动通过',
    color: colors.onSecondaryContainer,
    background: colors.secondaryContainer,
  },
  APPROVED: {
    label: '审核通过',
    color: colors.onSecondaryContainer,
    background: colors.secondaryContainer,
  },
  PENDING: {
    label: '待审核',
    color: colors.warning,
    background: colors.warningLight,
  },
  REJECTED: {
    label: '已驳回',
    color: colors.onErrorContainer,
    background: colors.errorContainer,
  },
};

export function StatusChip({ status }: { status: ReviewStatus }) {
  const meta = statusMap[status];
  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: meta.background,
        alignSelf: 'flex-start',
      }}
    >
      <Text selectable style={{ ...typography.labelBold, color: meta.color }}>
        {meta.label}
      </Text>
    </View>
  );
}
