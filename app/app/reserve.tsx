import { PlusCircle, Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/src/components/card';
import { PrimaryButton } from '@/src/components/primary-button';
import { SelectField } from '@/src/components/select-field';
import { TextField } from '@/src/components/text-field';
import { TopBar } from '@/src/components/top-bar';
import { VisitTimePicker } from '@/src/components/visit-time-picker';
import { campusOptions, transportOptions } from '@/src/data/options';
import { createReservation, isAuthExpiredError, listDepartmentOptions } from '@/src/services/api';
import type { DepartmentOption } from '@/src/services/api';
import { colors, commonStyles, spacing, typography } from '@/src/theme';
import type { ReservationType } from '@/src/types';

type Companion = {
  id: number;
  name: string;
  idCard: string;
  mobile: string;
};

export default function ReserveScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [reservationType, setReservationType] = useState<ReservationType>('public');
  const [campus, setCampus] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [unit, setUnit] = useState('');
  const [name, setName] = useState('');
  const [idCard, setIdCard] = useState('');
  const [mobile, setMobile] = useState('');
  const [department, setDepartment] = useState('');
  const [host, setHost] = useState('');
  const [reason, setReason] = useState('');
  const [transport, setTransport] = useState('public');
  const [plateNo, setPlateNo] = useState('');
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [loading, setLoading] = useState(false);
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentOption[]>([]);
  const [departmentsLoaded, setDepartmentsLoaded] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentsError, setDepartmentsError] = useState('');

  const visitDeptOptions = useMemo(
    () => [
      { label: departmentsLoading ? '部门加载中...' : '请选择访问部门', value: '' },
      ...departmentOptions,
    ],
    [departmentOptions, departmentsLoading],
  );

  const loadDepartments = useCallback(async () => {
    setDepartmentsLoading(true);
    setDepartmentsError('');
    try {
      const options = await listDepartmentOptions();
      setDepartmentOptions(options);
      setDepartmentsLoaded(true);
      if (department && !options.some((option) => option.value === department)) {
        setDepartment('');
      }
    } catch (error) {
      setDepartmentsError(error instanceof Error ? error.message : '访问部门加载失败');
    } finally {
      setDepartmentsLoading(false);
    }
  }, [department]);

  useEffect(() => {
    if (reservationType === 'official' && !departmentsLoaded && !departmentsLoading && !departmentsError) {
      loadDepartments();
    }
  }, [departmentsError, departmentsLoaded, departmentsLoading, loadDepartments, reservationType]);

  const addCompanion = () => {
    setCompanions((items) => [...items, { id: Date.now(), name: '', idCard: '', mobile: '' }]);
  };

  const updateCompanion = (id: number, patch: Partial<Companion>) => {
    setCompanions((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeCompanion = (id: number) => {
    setCompanions((items) => items.filter((item) => item.id !== id));
  };

  const submit = async () => {
    setLoading(true);
    try {
      const result = await createReservation({
        reservationType,
        campus,
        visitTime,
        unit,
        name,
        idCard,
        mobile,
        department,
        host,
        reason,
        transport,
        plateNo,
        companions,
      });
      if (result.status === 'AUTO_APPROVED') {
        router.replace('/pass');
      } else {
        Alert.alert('预约已提交', '公务预约已提交，请等待访问部门审核。');
        router.replace('/reservations');
      }
    } catch (error) {
      if (isAuthExpiredError(error)) {
        Alert.alert('登录已过期', '请重新登录后再提交预约。', [
          {
            text: '重新登录',
            onPress: () => router.replace({ pathname: '/login', params: { redirect: '/reserve' } }),
          },
          { text: '取消', style: 'cancel' },
        ]);
        return;
      }
      Alert.alert('提交失败', error instanceof Error ? error.message : '请检查预约信息');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <TopBar title="校园通行码" />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: 108 + insets.bottom,
          gap: spacing.xl,
        }}
      >
        <View style={commonStyles.segmentedControl}>
          <SegmentButton
            label="社会公众预约"
            active={reservationType === 'public'}
            onPress={() => setReservationType('public')}
          />
          <SegmentButton
            label="公务预约"
            active={reservationType === 'official'}
            onPress={() => setReservationType('official')}
          />
        </View>

        <Card style={{ gap: spacing.md }}>
          <SelectField label="预约校区" required value={campus} onChange={setCampus} options={campusOptions} />
          <VisitTimePicker
            label="预约进校日期"
            required
            value={visitTime}
            onChange={setVisitTime}
          />
        </Card>

        <Card style={{ gap: spacing.md }}>
          <TextField label="所在单位" required value={unit} onChangeText={setUnit} placeholder="请输入所在单位名称" />
          <TextField label="姓名" required value={name} onChangeText={setName} placeholder="请输入真实姓名" />
          <TextField label="身份证号" required value={idCard} onChangeText={setIdCard} placeholder="请输入18位身份证号码" />
          <TextField
            label="手机号"
            required
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
            placeholder="请输入11位手机号码"
          />
        </Card>

        {reservationType === 'official' ? (
          <Card style={{ gap: spacing.md }}>
            <SelectField
              label="公务访问部门"
              required
              value={department}
              onChange={setDepartment}
              options={visitDeptOptions}
            />
            {departmentsError ? (
              <View style={{ gap: spacing.sm }}>
                <Text selectable style={{ ...typography.bodyMd, color: colors.error }}>
                  {departmentsError}
                </Text>
                <Pressable onPress={loadDepartments} style={{ alignSelf: 'flex-start' }}>
                  <Text selectable style={{ ...typography.labelBold, color: colors.primary }}>
                    重新加载访问部门
                  </Text>
                </Pressable>
              </View>
            ) : null}
            {!departmentsError && departmentsLoaded && !departmentOptions.length ? (
              <Text selectable style={{ ...typography.bodyMd, color: colors.onSurfaceVariant }}>
                暂无可选访问部门，请联系后台管理员创建并启用部门。
              </Text>
            ) : null}
            <TextField label="接待人" required value={host} onChangeText={setHost} placeholder="请输入校内接待人姓名" />
            <TextField
              label="来访事由"
              required
              value={reason}
              onChangeText={setReason}
              placeholder="请简述来访事由"
              multiline
            />
          </Card>
        ) : null}

        <Card style={{ gap: spacing.md }}>
          <SelectField
            label="交通方式"
            required
            value={transport}
            onChange={setTransport}
            options={transportOptions}
          />
          {transport === 'drive' ? (
            <TextField label="车牌号" required value={plateNo} onChangeText={setPlateNo} placeholder="请输入车牌号 (例: 京A88888)" />
          ) : null}
        </Card>

        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text selectable style={{ ...typography.headlineMd, color: colors.onSurface }}>
              随行人员
              <Text style={{ ...typography.bodyMd, color: colors.onSurfaceVariant }}> (选填)</Text>
            </Text>
            <Pressable onPress={addCompanion} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <PlusCircle size={18} color={colors.primary} />
              <Text selectable style={{ ...typography.labelBold, color: colors.primary }}>
                添加
              </Text>
            </Pressable>
          </View>
          {companions.map((person, index) => (
            <Card key={person.id} style={{ backgroundColor: colors.surfaceContainerLow, gap: spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text selectable style={{ ...typography.bodyMdStrong, color: colors.onSurface }}>
                  随行人员 {index + 1}
                </Text>
                <Pressable onPress={() => removeCompanion(person.id)}>
                  <Trash2 size={18} color={colors.error} />
                </Pressable>
              </View>
              <TextField
                label="姓名"
                required
                value={person.name}
                onChangeText={(value) => updateCompanion(person.id, { name: value })}
                placeholder="随行人员姓名"
              />
              <TextField
                label="身份证号"
                required
                value={person.idCard}
                onChangeText={(value) => updateCompanion(person.id, { idCard: value })}
                placeholder="18位身份证号"
              />
              <TextField
                label="手机号"
                required
                value={person.mobile}
                onChangeText={(value) => updateCompanion(person.id, { mobile: value })}
                keyboardType="phone-pad"
                placeholder="11位手机号"
              />
            </Card>
          ))}
        </View>
      </ScrollView>
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: spacing.lg,
          paddingBottom: spacing.lg + insets.bottom,
          backgroundColor: colors.surfaceContainerLowest,
          borderTopWidth: 1,
          borderColor: colors.outlineVariant,
        }}
      >
        <PrimaryButton label="提交预约申请" onPress={submit} loading={loading} />
      </View>
    </View>
  );
}

function SegmentButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        height: 36,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? colors.primary : 'transparent',
      }}
    >
      <Text selectable style={{ ...typography.labelBold, color: active ? colors.onPrimary : colors.onSurfaceVariant }}>
        {label}
      </Text>
    </Pressable>
  );
}
