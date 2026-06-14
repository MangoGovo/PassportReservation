import { CalendarCheck, QrCode } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '@/src/theme';

type TabKey = 'home' | 'pass';

export function BottomTabs({
  active,
  onHomePress,
  onPassPress,
}: {
  active: TabKey;
  onHomePress?: () => void;
  onPassPress?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tabsWidth, setTabsWidth] = useState(0);
  const activeIndex = active === 'home' ? 0 : 1;
  const highlightProgress = useSharedValue(activeIndex);
  const tabWidth = tabsWidth > 0 ? (tabsWidth - spacing.sm) / 2 : 0;

  useEffect(() => {
    highlightProgress.value = withTiming(activeIndex, { duration: 220 });
  }, [activeIndex, highlightProgress]);

  const highlightStyle = useAnimatedStyle(
    () => ({
      width: tabWidth,
      transform: [{ translateX: highlightProgress.value * (tabWidth + spacing.sm) }],
    }),
    [tabWidth],
  );

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
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
      }}
    >
      <View
        onLayout={(event) => setTabsWidth(event.nativeEvent.layout.width)}
        style={{
          flex: 1,
          maxWidth: 368,
          height: 50,
          flexDirection: 'row',
          gap: spacing.sm,
          position: 'relative',
        }}
      >
        {tabWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                borderRadius: 12,
                backgroundColor: colors.primaryContainer,
              },
              highlightStyle,
            ]}
          />
        ) : null}
        <TabButton
          active={active === 'home'}
          label="访问预约"
          icon={<CalendarCheck />}
          onPress={active === 'home' ? undefined : onHomePress ?? (() => router.replace('/'))}
        />
        {onPassPress ? (
          <TabButton active={active === 'pass'} label="我的通行" icon={<QrCode />} onPress={onPassPress} />
        ) : (
          <TabButton
            active={active === 'pass'}
            label="我的通行"
            icon={<QrCode />}
            onPress={active === 'pass' ? undefined : () => router.replace('/pass')}
          />
        )}
      </View>
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
        flex: 1,
        height: 50,
        borderRadius: 12,
        paddingHorizontal: spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed && !active ? colors.surfaceContainerLow : 'transparent',
        transform: [{ scale: pressed ? 0.96 : 1 }],
        zIndex: 1,
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
