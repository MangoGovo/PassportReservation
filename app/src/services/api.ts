import type { CreateReservationInput, PassDetail, PassStatus, ReservationSummary, ReviewStatus } from '@/src/types';
import { firstNameCharacter, maskIdCard, maskName } from '@/src/utils/masking';

const today = '2026-06-08';

const mockReservations: ReservationSummary[] = [
  {
    id: 'public-valid',
    applyDate: '2026-06-08',
    visitDate: today,
    campus: '主校区',
    typeLabel: '校友探访',
    status: 'AUTO_APPROVED',
    statusLabel: '自动通过',
  },
  {
    id: 'official-pending',
    applyDate: '2026-06-07',
    visitDate: '2026-06-12',
    campus: '东校区',
    typeLabel: '公务洽谈',
    status: 'PENDING',
    statusLabel: '待审核',
  },
  {
    id: 'official-rejected',
    applyDate: '2026-06-05',
    visitDate: '2026-06-06',
    campus: '南校区',
    typeLabel: '临时施工',
    status: 'REJECTED',
    statusLabel: '已驳回',
  },
];

const reviewLabel: Record<ReviewStatus, string> = {
  AUTO_APPROVED: '自动通过',
  PENDING: '待审核',
  APPROVED: '审核通过',
  REJECTED: '已驳回',
};

function delay<T>(value: T) {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(value), 250);
  });
}

export async function login(input: { mobile: string; password: string }) {
  if (!/^1\d{10}$/.test(input.mobile)) {
    throw new Error('请输入有效的11位手机号码。');
  }
  if (!input.password) {
    throw new Error('请输入密码。');
  }
  return delay({ token: 'mock-mobile-token', mobile: input.mobile });
}

export async function register(input: { realName: string; mobile: string; code: string; password: string }) {
  if (!input.realName.trim()) {
    throw new Error('请输入真实姓名。');
  }
  if (!/^1\d{10}$/.test(input.mobile)) {
    throw new Error('请输入有效的11位手机号码。');
  }
  if (!input.code.trim()) {
    throw new Error('请输入验证码。');
  }
  if (input.password.length < 8) {
    throw new Error('密码长度至少8位。');
  }
  return delay({ token: 'mock-mobile-token', mobile: input.mobile });
}

export async function createReservation(input: CreateReservationInput) {
  if (!input.campus || !input.unit || !input.name || !input.idCard || !input.mobile) {
    throw new Error('请填写完整的预约基础信息。');
  }
  if (input.reservationType === 'official' && (!input.department || !input.host || !input.reason)) {
    throw new Error('公务预约需填写访问部门、接待人和来访事由。');
  }
  if (input.transport === 'drive' && !input.plateNo) {
    throw new Error('自驾入校请填写车牌号。');
  }

  const status: ReviewStatus = input.reservationType === 'public' ? 'AUTO_APPROVED' : 'PENDING';
  return delay({
    id: input.reservationType === 'public' ? 'public-valid' : 'official-pending',
    status,
    statusLabel: reviewLabel[status],
  });
}

export async function queryReservations(input: { name: string; idCard: string; mobile: string }) {
  if (!input.name.trim() && !input.idCard.trim() && !input.mobile.trim()) {
    return delay(mockReservations);
  }
  return delay(mockReservations);
}

export async function getPass(id: string): Promise<PassDetail> {
  const reservation = mockReservations.find((item) => item.id === id) ?? mockReservations[0];
  const passStatus = getPassStatus(reservation);

  return delay({
    id: reservation.id,
    passStatus,
    avatarText: firstNameCharacter('张三'),
    nameMasked: maskName('张三'),
    idCardMasked: maskIdCard('310101199001011234'),
    campusGate: reservation.campus === '主校区' ? '主校区 - 东门' : `${reservation.campus} - 正门`,
    visitDate: reservation.visitDate,
    validTime: '08:00 - 18:00',
  });
}

function getPassStatus(reservation: ReservationSummary): PassStatus {
  if (reservation.status === 'PENDING') {
    return 'PENDING';
  }
  if (reservation.status === 'REJECTED') {
    return 'REJECTED';
  }
  if (reservation.visitDate > today) {
    return 'NOT_YET';
  }
  if (reservation.visitDate < today) {
    return 'EXPIRED';
  }
  return 'VALID';
}
