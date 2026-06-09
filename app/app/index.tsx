import {
  CalendarCheck,
  History,
  Info,
  Landmark,
  Lock,
} from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { BottomTabs } from '@/src/components/bottom-tabs';
import { Card } from '@/src/components/card';
import { CurrentPassContent } from '@/src/components/current-pass-content';
import { PrimaryButton } from '@/src/components/primary-button';
import { ScreenContainer } from '@/src/components/screen-container';
import { TopBar } from '@/src/components/top-bar';
import { hasCachedLogin } from '@/src/services/api';
import { colors, commonStyles, spacing, typography } from '@/src/theme';

type ProtectedTarget = '/reserve' | '/reservations' | '/pass';

const rules = [
  {
    title: '进校规则',
    body: '请提前至少1个工作日提交预约申请，如实填写到访事由及随行人员信息。入校时须出示有效身份证件及生成的通行二维码。',
  },
  {
    title: '有效期说明',
    body: '通行码仅在预约批准的日期及时段内有效。单次预约仅限单次进出校园，过期需重新申请。',
  },
  {
    title: '隐私保护政策',
    body: '我们严格遵守数据安全法规。您提交的个人信息仅用于校园安防及访客管理，系统将在访问结束后定期脱敏处理。',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [target, setTarget] = useState<ProtectedTarget | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'pass'>('home');

  useEffect(() => {
    if (tab === 'pass') {
      setActiveTab('pass');
    }
  }, [tab]);

  const openAuthGate = async (nextTarget: ProtectedTarget, options?: { replace?: boolean }) => {
    if (await hasCachedLogin()) {
      if (options?.replace) {
        router.replace(nextTarget);
      } else {
        router.push(nextTarget);
      }
      return;
    }
    setTarget(nextTarget);
  };

  const closeAuthGate = () => {
    setTarget(null);
  };

  const openPassTab = async () => {
    if (await hasCachedLogin()) {
      setActiveTab('pass');
      return;
    }
    setTarget('/pass');
  };

  const goAuth = (path: '/login' | '/register') => {
    const redirect = target ?? '/reserve';
    closeAuthGate();
    router.push({ pathname: path, params: { redirect } });
  };

  return (
    <>
      <TopBar title="校园通行码" back={false} />
      <ScreenContainer
        bottom={
          <BottomTabs
            active={activeTab}
            onHomePress={() => setActiveTab('home')}
            onPassPress={openPassTab}
          />
        }
      >
        {activeTab === 'home' ? (
          <>
            <Card style={{ padding: 24, alignItems: 'center', gap: spacing.sm }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.primaryFixed,
                }}
              >
                <Landmark size={28} color={colors.primary} />
              </View>
              <Text
                selectable
                style={{
                  ...typography.headlineLg,
                  color: colors.onSurface,
                  textAlign: 'center',
                }}
              >
                校园通行码预约管理系统
              </Text>
              <Text selectable style={{ ...typography.bodyMd, color: colors.onSurfaceVariant }}>
                欢迎访问某某大学预约系统
              </Text>
            </Card>

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <Pressable
                onPress={() => openAuthGate('/reserve')}
                style={({ pressed }) => ({
                  ...commonStyles.primaryActionCard,
                  opacity: pressed ? 0.88 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}
              >
                <CalendarCheck size={30} color={colors.onPrimary} />
                <Text selectable style={{ ...typography.bodyLgStrong, color: colors.onPrimary }}>
                  我要预约
                </Text>
              </Pressable>
              <Pressable
                onPress={() => openAuthGate('/reservations')}
                style={({ pressed }) => ({
                  ...commonStyles.secondaryActionCard,
                  opacity: pressed ? 0.88 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}
              >
                <History size={30} color={colors.primary} />
                <Text selectable style={{ ...typography.bodyLgStrong, color: colors.primary }}>
                  我的预约
                </Text>
              </Pressable>
            </View>

            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <View
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderColor: colors.outlineVariant,
                  backgroundColor: colors.surfaceContainerLow,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                }}
              >
                <Info size={20} color={colors.primary} />
                <Text selectable style={{ ...typography.bodyLgStrong, color: colors.onSurface }}>
                  预约说明与规则
                </Text>
              </View>
              <View style={{ padding: spacing.lg, gap: spacing.md }}>
                {rules.map((rule, index) => (
                  <View key={rule.title} style={{ gap: spacing.md }}>
                    <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: colors.primaryFixed,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text selectable style={{ ...typography.labelBold, color: colors.primary }}>
                          {index + 1}
                        </Text>
                      </View>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text selectable style={{ ...typography.bodyMdStrong, color: colors.onSurface }}>
                          {rule.title}
                        </Text>
                        <Text selectable style={{ ...typography.bodyMd, color: colors.onSurfaceVariant }}>
                          {rule.body}
                        </Text>
                      </View>
                    </View>
                    {index < rules.length - 1 ? (
                      <View style={{ height: 1, backgroundColor: colors.outlineVariant }} />
                    ) : null}
                  </View>
                ))}
              </View>
            </Card>

            <Footer />
          </>
        ) : (
          <CurrentPassContent />
        )}
      </ScreenContainer>

      <Modal transparent visible={target !== null} animationType="fade" onRequestClose={closeAuthGate}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.42)',
            padding: spacing.lg,
            justifyContent: 'center',
          }}
        >
          <Card style={{ padding: 24, gap: spacing.lg }}>
            <View style={{ alignItems: 'center', gap: spacing.sm }}>
              <Lock size={48} color={colors.primary} />
              <Text selectable style={{ ...typography.headlineMd, color: colors.onSurface }}>
                请先登录
              </Text>
              <Text selectable style={{ ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' }}>
                您需要登录后才能使用预约及通行功能
              </Text>
            </View>
            <View style={{ gap: spacing.sm }}>
              <PrimaryButton label="立即登录" onPress={() => goAuth('/login')} />
              <PrimaryButton label="注册账号" variant="outline" onPress={() => goAuth('/register')} />
              <Pressable onPress={closeAuthGate} style={{ paddingVertical: 10, alignItems: 'center' }}>
                <Text selectable style={{ ...typography.bodyMd, color: colors.onSurfaceVariant }}>
                  稍后再说
                </Text>
              </Pressable>
            </View>
          </Card>
        </View>
      </Modal>
    </>
  );
}

function Footer() {
  return (
    <View style={{ alignItems: 'center', gap: spacing.sm, paddingTop: spacing.md }}>
      <View style={{ flexDirection: 'row', gap: spacing.xl }}>
        <Text selectable style={{ ...typography.bodyMd, color: colors.onSurfaceVariant }}>
          隐私政策
        </Text>
        <Text selectable style={{ ...typography.bodyMd, color: colors.onSurfaceVariant }}>
          使用指南
        </Text>
      </View>
      <Text selectable style={{ ...typography.label, color: colors.onSurfaceVariant, textAlign: 'center' }}>
        © 2024 校园通行码管理系统 | 某某大学信息化中心
      </Text>
    </View>
  );
}
