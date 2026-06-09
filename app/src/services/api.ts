import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import type { CreateReservationInput, PassDetail, PassStatus, ReservationSummary, ReviewStatus } from '@/src/types';
import { firstNameCharacter, maskName } from '@/src/utils/masking';

type ApiEnvelope<T> = {
  code: number;
  message: string;
  data: T;
};

type LoginResponse = {
  tokenName: string;
  tokenValue: string;
  userId: number;
  userType: string;
  displayName?: string;
};

type PageResponse<T> = {
  page: number;
  size: number;
  total: number;
  records: T[];
};

type BackendReservationItem = {
  id: number;
  reservationNo: string;
  reservationType: 'PUBLIC' | 'OFFICIAL';
  campusName?: string;
  applyTime: string;
  visitTime: string;
  approvalStatus: ReviewStatus;
};

type BackendReservationDetail = BackendReservationItem & {
  visitorName: string;
  idCard: string;
  phone: string;
  validStartTime: string;
  validEndTime: string;
  passStatus: 'VALID' | 'NOT_STARTED' | 'EXPIRED' | 'UNAPPROVED';
};

type BackendPassCode = {
  reservationId: number;
  reservationNo: string;
  passStatus: 'VALID' | 'NOT_STARTED' | 'EXPIRED' | 'UNAPPROVED';
  statusText: string;
  qrBase64?: string | null;
  validStartTime: string;
  validEndTime: string;
};

type BackendCurrentPass = {
  reservation: BackendReservationDetail;
  passCode: BackendPassCode;
};

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080');

const campusIdByValue: Record<string, number> = {
  main: 1,
  east: 2,
  south: 3,
};

const reviewLabel: Record<ReviewStatus, string> = {
  AUTO_APPROVED: '自动通过',
  PENDING: '待审核',
  APPROVED: '审核通过',
  REJECTED: '已驳回',
};

const typeLabel: Record<BackendReservationItem['reservationType'], string> = {
  PUBLIC: '社会公众预约',
  OFFICIAL: '公务预约',
};

const TOKEN_STORAGE_KEY = 'campus-pass-token';

let authToken: string | null = readWebStoredToken();
let tokenLoaded = Platform.OS === 'web';
let tokenLoadPromise: Promise<void> | null = null;

export async function login(input: { mobile: string; password: string }) {
  if (!/^1\d{10}$/.test(input.mobile)) {
    throw new Error('请输入有效的11位手机号码。');
  }
  if (!input.password) {
    throw new Error('请输入密码。');
  }
  const result = await apiRequest<LoginResponse>('/api/mobile/auth/login', {
    method: 'POST',
    auth: false,
    json: { mobile: input.mobile, password: input.password },
  });
  await persistToken(result.tokenValue);
  return { token: result.tokenValue, mobile: input.mobile };
}

export async function register(input: { realName: string; mobile: string; code: string; password: string }) {
  if (!input.realName.trim()) {
    throw new Error('请输入真实姓名。');
  }
  if (!/^1\d{10}$/.test(input.mobile)) {
    throw new Error('请输入有效的11位手机号码。');
  }
  if (input.password.length < 8) {
    throw new Error('密码长度至少8位。');
  }
  const result = await apiRequest<LoginResponse>('/api/mobile/auth/register', {
    method: 'POST',
    auth: false,
    json: {
      mobile: input.mobile,
      realName: input.realName,
      password: input.password,
    },
  });
  await persistToken(result.tokenValue);
  return { token: result.tokenValue, mobile: input.mobile };
}

export async function hasCachedLogin() {
  await ensureTokenLoaded();
  return Boolean(authToken);
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

  const campusId = campusIdByValue[input.campus];
  if (!campusId) {
    throw new Error('请选择预约校区。');
  }

  const result = await apiRequest<BackendReservationDetail>('/api/mobile/reservations', {
    method: 'POST',
    json: {
      reservationType: input.reservationType === 'public' ? 'PUBLIC' : 'OFFICIAL',
      campusId,
      visitTime: normalizeVisitTime(input.visitTime),
      organization: input.unit,
      visitorName: input.name,
      idCard: input.idCard,
      phone: input.mobile,
      trafficType: mapTrafficType(input.transport),
      plateNo: input.plateNo,
      companions: input.companions.map((item) => ({
        name: item.name,
        idCard: item.idCard,
        phone: item.mobile,
      })),
      visitDeptId: input.reservationType === 'official' ? Number(input.department) : undefined,
      receptionist: input.host,
      visitReason: input.reason,
    },
  });

  return {
    id: String(result.id),
    status: result.approvalStatus,
    statusLabel: reviewLabel[result.approvalStatus],
  };
}

export async function queryReservations(input: { name: string; idCard: string; mobile: string }) {
  if (!input.name.trim() || !input.idCard.trim() || !input.mobile.trim()) {
    throw new Error('请输入姓名、身份证号和手机号后查询。');
  }
  const result = await apiRequest<PageResponse<BackendReservationItem>>('/api/mobile/reservations/query', {
    method: 'POST',
    json: {
      name: input.name,
      idCard: input.idCard,
      phone: input.mobile,
      page: 1,
      size: 20,
    },
  });
  return result.records.map(toReservationSummary);
}

export async function listMyReservations() {
  const result = await apiRequest<PageResponse<BackendReservationItem>>('/api/mobile/reservations/mine?page=1&size=50');
  return result.records.map(toReservationSummary);
}

export async function getPass(id: string): Promise<PassDetail> {
  const [detail, pass] = await Promise.all([
    apiRequest<BackendReservationDetail>(`/api/mobile/reservations/${id}`),
    apiRequest<BackendPassCode>(`/api/mobile/reservations/${id}/pass-code`),
  ]);

  return toPassDetail(detail, pass);
}

export async function getCurrentPass(): Promise<PassDetail | null> {
  const result = await apiRequest<BackendCurrentPass | null>('/api/mobile/reservations/current-pass-code');
  if (!result) {
    return null;
  }
  return toPassDetail(result.reservation, result.passCode);
}

function toPassDetail(detail: BackendReservationDetail, pass: BackendPassCode): PassDetail {
  return {
    id: String(detail.id),
    passStatus: mapPassStatus(pass.passStatus, detail.approvalStatus),
    statusLabel: reviewLabel[detail.approvalStatus],
    typeLabel: typeLabel[detail.reservationType],
    reservationNo: detail.reservationNo,
    avatarText: firstNameCharacter(detail.visitorName),
    nameMasked: maskName(detail.visitorName),
    idCardMasked: detail.idCard,
    campusGate: `${detail.campusName ?? '校区'} - 正门`,
    visitDate: datePart(detail.visitTime),
    validTime: `${timePart(pass.validStartTime)} - ${timePart(pass.validEndTime)}`,
    qrBase64: pass.qrBase64 ?? undefined,
  };
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  json?: unknown;
  auth?: boolean;
};

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  await ensureTokenLoaded();

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (options.json !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.auth !== false && authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.json === undefined ? undefined : JSON.stringify(options.json),
    });
  } catch {
    throw new ApiError(`无法连接后端服务：${API_BASE_URL}`, 0);
  }

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok || !payload || payload.code !== 0) {
    throw new ApiError(payload?.message || `请求失败 (${response.status})`, response.status);
  }
  return payload.data;
}

function toReservationSummary(item: BackendReservationItem): ReservationSummary {
  return {
    id: String(item.id),
    applyDate: datePart(item.applyTime),
    visitDate: datePart(item.visitTime),
    campus: item.campusName ?? '未知校区',
    typeLabel: typeLabel[item.reservationType],
    status: item.approvalStatus,
    statusLabel: reviewLabel[item.approvalStatus],
  };
}

function mapPassStatus(passStatus: BackendPassCode['passStatus'], reviewStatus: ReviewStatus): PassStatus {
  if (reviewStatus === 'PENDING') {
    return 'PENDING';
  }
  if (reviewStatus === 'REJECTED') {
    return 'REJECTED';
  }
  if (passStatus === 'NOT_STARTED') {
    return 'NOT_YET';
  }
  if (passStatus === 'EXPIRED') {
    return 'EXPIRED';
  }
  return 'VALID';
}

function mapTrafficType(value: string) {
  const mapping: Record<string, string> = {
    public: 'PUBLIC_TRANSPORT',
    drive: 'DRIVE',
    bike: 'BIKE',
  };
  return mapping[value] ?? 'OTHER';
}

function normalizeVisitTime(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error('请填写预约进校时间。');
  }
  const normalized = trimmed.replace(/\//g, '-').replace(' ', 'T');
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return `${normalized}T09:00:00`;
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) {
    return `${normalized}:00`;
  }
  return normalized;
}

function datePart(value: string) {
  return value.slice(0, 10);
}

function timePart(value: string) {
  return value.slice(11, 16);
}

async function persistToken(token: string) {
  authToken = token;
  if (Platform.OS !== 'web') {
    await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
    return;
  }
  try {
    globalThis.localStorage?.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // Native runtime without localStorage keeps the token in memory for this session.
  }
}

async function ensureTokenLoaded() {
  if (tokenLoaded) {
    return;
  }
  if (!tokenLoadPromise) {
    tokenLoadPromise = (async () => {
      try {
        authToken = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
      } finally {
        tokenLoaded = true;
      }
    })();
  }
  await tokenLoadPromise;
}

function readWebStoredToken() {
  if (Platform.OS !== 'web') {
    return null;
  }
  try {
    return globalThis.localStorage?.getItem(TOKEN_STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}
