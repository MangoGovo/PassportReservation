import { LogIn, ShieldAlert } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Card } from '@/src/components/card';
import { PrimaryButton } from '@/src/components/primary-button';
import { colors, spacing, typography } from '@/src/theme';

export function SessionExpiredCard({ onLogin }: { onLogin: () => void }) {
  return (
    <Card style={{ gap: spacing.md, alignItems: 'center' }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.warningLight,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ShieldAlert size={30} color={colors.warning} />
      </View>
      <Text selectable style={{ ...typography.bodyLgStrong, color: colors.onSurface }}>
        登录已过期
      </Text>
      <Text selectable style={{ ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' }}>
        请重新登录后刷新当前内容。
      </Text>
      <PrimaryButton label="重新登录" onPress={onLogin} leftIcon={<LogIn size={18} color={colors.onPrimary} />} />
    </Card>
  );
}
