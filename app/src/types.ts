export type ReservationType = 'public' | 'official';

export type ReviewStatus = 'AUTO_APPROVED' | 'PENDING' | 'APPROVED' | 'REJECTED';

export type PassStatus = 'VALID' | 'NOT_YET' | 'EXPIRED' | 'PENDING' | 'REJECTED';

export type ReservationSummary = {
  id: string;
  applyDate: string;
  visitDate: string;
  campus: string;
  typeLabel: string;
  status: ReviewStatus;
  statusLabel: string;
};

export type PassDetail = {
  id: string;
  passStatus: PassStatus;
  avatarText: string;
  nameMasked: string;
  idCardMasked: string;
  campusGate: string;
  visitDate: string;
  validTime: string;
};

export type CreateReservationInput = {
  reservationType: ReservationType;
  campus: string;
  visitTime: string;
  unit: string;
  name: string;
  idCard: string;
  mobile: string;
  department?: string;
  host?: string;
  reason?: string;
  transport: string;
  plateNo?: string;
  companions: Array<{
    name: string;
    idCard: string;
    mobile: string;
  }>;
};
