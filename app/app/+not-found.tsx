import { Link } from 'expo-router';
import { Text, View } from 'react-native';

import { PrimaryButton } from '@/src/components/primary-button';
import { TopBar } from '@/src/components/top-bar';
import { colors, spacing, typography } from '@/src/theme';

export default function NotFoundScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, padding: spacing.lg, justifyContent: 'center', gap: spacing.lg }}>
      <TopBar title="页面不存在" />
      <Text selectable style={{ ...typography.headlineMd, color: colors.onSurface, textAlign: 'center' }}>
        页面不存在
      </Text>
      <Link href="/" asChild>
        <PrimaryButton label="返回首页" onPress={() => {}} />
      </Link>
    </View>
  );
}
