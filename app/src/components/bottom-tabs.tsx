import { CalendarCheck, QrCode, UserRound } from 'lucide-react-native';
import { Link } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '@/src/theme';

type TabKey = 'home' | 'pass' | 'profile';

export function BottomTabs({
  active,
  onPassPress,
}: {
  active: TabKey;
  onPassPress?: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        minHeight: 64 + insets.bottom,
        paddingBottom: insets.bottom,
        borderTopWidth: 1,
        borderColor: colors.outlineVariant,
        backgroundColor: colors.surface,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: spacing.sm,
      }}
    >
      <Link href="/" asChild>
        <TabButton active={active === 'home'} label="预约管理" icon={<CalendarCheck />} />
      </Link>
      {onPassPress ? (
        <TabButton active={active === 'pass'} label="我的通行" icon={<QrCode />} onPress={onPassPress} />
      ) : (
        <Link href="/pass/demo" asChild>
          <TabButton active={active === 'pass'} label="我的通行" icon={<QrCode />} />
        </Link>
      )}
      <Link href="/" asChild>
        <TabButton active={active === 'profile'} label="个人中心" icon={<UserRound />} />
      </Link>
    </View>
  );
}

function TabButton({
  active,
  label,
  icon,
  onPress,
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        minWidth: 86,
        height: 48,
        borderRadius: 12,
        paddingHorizontal: spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? colors.primaryContainer : pressed ? colors.surfaceContainerLow : 'transparent',
        transform: [{ scale: pressed ? 0.96 : 1 }],
      })}
    >
      {iconWithColor(icon, active ? colors.onPrimaryContainer : colors.onSurfaceVariant)}
      <Text selectable style={{ ...typography.labelBold, color: active ? colors.onPrimaryContainer : colors.onSurfaceVariant }}>
        {label}
      </Text>
    </Pressable>
  );
}

function iconWithColor(icon: ReactNode, color: string) {
  if (!icon || typeof icon !== 'object' || !('type' in icon)) {
    return icon;
  }
  const element = icon as React.ReactElement<{ size?: number; color?: string; strokeWidth?: number }>;
  return {
    ...element,
    props: {
      ...element.props,
      size: 20,
      color,
      strokeWidth: 2,
    },
  };
}
