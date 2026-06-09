import {
  Check,
  Eye,
  EyeOff,
  Info,
  Lock,
  LockKeyhole,
  MailCheck,
  Smartphone,
  User,
} from 'lucide-react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { Card } from '@/src/components/card';
import { PrimaryButton } from '@/src/components/primary-button';
import { ScreenContainer } from '@/src/components/screen-container';
import { TextField } from '@/src/components/text-field';
import { TopBar } from '@/src/components/top-bar';
import { register } from '@/src/services/api';
import { colors, spacing, typography } from '@/src/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const [realName, setRealName] = useState('');
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!agreed) {
      Alert.alert('请确认协议', '请先阅读并同意用户协议及隐私政策。');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('密码不一致', '请确认两次输入的密码一致。');
      return;
    }
    setLoading(true);
    try {
      await register({ realName, mobile, code, password });
      router.replace((redirect as '/reserve') || '/reserve');
    } catch (error) {
      Alert.alert('注册失败', error instanceof Error ? error.message : '请检查注册信息');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TopBar title="校园通行码" />
      <ScreenContainer>
        <View style={{ gap: spacing.sm }}>
          <Text selectable style={{ ...typography.headlineLg, color: colors.onSurface }}>
            账号注册
          </Text>
          <Text selectable style={{ ...typography.bodyMd, color: colors.onSurfaceVariant }}>
            请填写以下信息以创建您的校园通行账户。
          </Text>
        </View>

        <Card style={{ padding: 20, gap: spacing.lg }}>
          <TextField
            label="真实姓名"
            value={realName}
            onChangeText={setRealName}
            placeholder="请输入真实姓名"
            leftIcon={User}
          />
          <TextField
            label="手机号码"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
            placeholder="请输入11位手机号"
            leftIcon={Smartphone}
          />
          <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' }}>
            <View style={{ flex: 1 }}>
              <TextField
                label="验证码"
                value={code}
                onChangeText={setCode}
                placeholder="输入验证码"
                leftIcon={MailCheck}
              />
            </View>
            <Pressable
              style={({ pressed }) => ({
                height: 48,
                paddingHorizontal: 14,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.outlineVariant,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed ? colors.surfaceContainer : colors.surfaceContainerLow,
              })}
            >
              <Text selectable style={{ ...typography.bodyMdStrong, color: colors.primary }}>
                获取验证码
              </Text>
            </Pressable>
          </View>
          <TextField
            label="设置密码"
            value={password}
            onChangeText={setPassword}
            placeholder="请输入密码"
            secureTextEntry={!passwordVisible}
            leftIcon={Lock}
            rightAction={
              <Pressable onPress={() => setPasswordVisible((value) => !value)}>
                {passwordVisible ? (
                  <Eye size={20} color={colors.outline} />
                ) : (
                  <EyeOff size={20} color={colors.outline} />
                )}
              </Pressable>
            }
          />
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: -10 }}>
            <Info size={14} color={colors.onSurfaceVariant} />
            <Text selectable style={{ ...typography.labelBold, color: colors.onSurfaceVariant }}>
              密码需包含数字、大小写字母和特殊字符，长度至少8位
            </Text>
          </View>
          <TextField
            label="确认密码"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="请再次输入密码"
            secureTextEntry={!confirmVisible}
            leftIcon={LockKeyhole}
            rightAction={
              <Pressable onPress={() => setConfirmVisible((value) => !value)}>
                {confirmVisible ? (
                  <Eye size={20} color={colors.outline} />
                ) : (
                  <EyeOff size={20} color={colors.outline} />
                )}
              </Pressable>
            }
          />

          <Pressable
            onPress={() => setAgreed((value) => !value)}
            style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: agreed ? colors.primary : colors.outlineVariant,
                backgroundColor: agreed ? colors.primary : colors.surfaceContainerLowest,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 2,
              }}
            >
              {agreed ? <Check size={14} color={colors.onPrimary} /> : null}
            </View>
            <Text selectable style={{ ...typography.bodyMd, color: colors.onSurfaceVariant, flex: 1 }}>
              我已阅读并同意
              <Text style={{ color: colors.primary }}>《用户协议》</Text>
              及
              <Text style={{ color: colors.primary }}>《隐私政策》</Text>
            </Text>
          </Pressable>

          <PrimaryButton label="立即注册" onPress={handleRegister} loading={loading} roundedFull />

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
            <Text selectable style={{ ...typography.bodyMd, color: colors.onSurfaceVariant }}>
              已有账号？
            </Text>
            <Link href={{ pathname: '/login', params: { redirect: redirect ?? '/reserve' } }}>
              <Text selectable style={{ ...typography.bodyMdStrong, color: colors.primary }}>
                去登录
              </Text>
            </Link>
          </View>
        </Card>
      </ScreenContainer>
    </>
  );
}
