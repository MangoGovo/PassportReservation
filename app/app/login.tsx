import { Eye, EyeOff, Landmark, LogIn, Lock, Smartphone } from 'lucide-react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { Card } from '@/src/components/card';
import { PrimaryButton } from '@/src/components/primary-button';
import { ScreenContainer } from '@/src/components/screen-container';
import { TextField } from '@/src/components/text-field';
import { TopBar } from '@/src/components/top-bar';
import { login } from '@/src/services/api';
import { colors, spacing, typography } from '@/src/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login({ mobile, password });
      router.replace((redirect as '/reserve') || '/reserve');
    } catch (error) {
      Alert.alert('登录失败', error instanceof Error ? error.message : '请检查手机号和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TopBar title="校园通行码" />
      <ScreenContainer>
        <Card style={{ padding: 24, gap: spacing.lg, marginTop: 28 }}>
          <View style={{ alignItems: 'center', gap: spacing.sm }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: colors.primaryContainer,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Landmark size={36} color={colors.onPrimary} />
            </View>
            <Text selectable style={{ ...typography.headlineLg, color: colors.onSurface }}>
              校园通行码
            </Text>
            <Text selectable style={{ ...typography.bodyMd, color: colors.onSurfaceVariant }}>
              登录以管理您的通行授权
            </Text>
          </View>

          <View style={{ gap: spacing.md }}>
            <TextField
              label="手机号码"
              value={mobile}
              onChangeText={setMobile}
              keyboardType="phone-pad"
              placeholder="请输入手机号码"
              prefix="+86"
              leftIcon={Smartphone}
            />
            <TextField
              label="密码"
              value={password}
              onChangeText={setPassword}
              placeholder="请输入密码"
              secureTextEntry={!passwordVisible}
              leftIcon={Lock}
              labelRight={
                <Text selectable style={{ ...typography.labelBold, color: colors.primary }}>
                  忘记密码?
                </Text>
              }
              rightAction={
                <Pressable onPress={() => setPasswordVisible((value) => !value)}>
                  {passwordVisible ? (
                    <Eye size={20} color={colors.onSurfaceVariant} />
                  ) : (
                    <EyeOff size={20} color={colors.onSurfaceVariant} />
                  )}
                </Pressable>
              }
            />
          </View>

          <PrimaryButton
            label="登录"
            onPress={handleLogin}
            loading={loading}
            rightIcon={<LogIn size={20} color={colors.onPrimary} />}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
            <Text selectable style={{ ...typography.bodyMd, color: colors.onSurfaceVariant }}>
              还没有账号?
            </Text>
            <Link href={{ pathname: '/register', params: { redirect: redirect ?? '/reserve' } }}>
              <Text selectable style={{ ...typography.labelBold, color: colors.primary }}>
                立即注册
              </Text>
            </Link>
          </View>
        </Card>

        <AuthFooter />
      </ScreenContainer>
    </>
  );
}

function AuthFooter() {
  return (
    <View style={{ alignItems: 'center', gap: spacing.sm, paddingTop: 16 }}>
      <Text selectable style={{ ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' }}>
        © 2024 校园通行管理系统 | 某某大学信息化中心
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.xl }}>
        <Text selectable style={{ ...typography.bodyMd, color: colors.onSurfaceVariant }}>
          隐私政策
        </Text>
        <Text selectable style={{ ...typography.bodyMd, color: colors.onSurfaceVariant }}>
          使用指南
        </Text>
      </View>
    </View>
  );
}
