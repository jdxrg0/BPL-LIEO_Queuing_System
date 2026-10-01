export interface User {
  id: number;
  username: string;
  name: string;
  role: 'ADMIN' | 'STAFF';
  createdAt: string;
  caterNew: boolean;
  caterRenewal: boolean;
  caterRetirement: boolean;
  autoAssign: boolean;
  isOnline: boolean;
  counterId: number | null;
  counter?: Counter;
  profilePictureBase64?: string | null;
}

export interface Service {
  id: number;
  name: string;
  prefix: string;
  description?: string | null;
  isActive: boolean;
}

export interface Counter {
  id: number;
  name: string;
  isActive: boolean;
}

export type TicketStatus = 'WAITING' | 'SERVING' | 'COMPLETED' | 'NO_SHOW' | 'POSTPONED';

export interface Ticket {
  id: number;
  number: string;
  status: TicketStatus;
  createdAt: string;
  servedAt?: string | null;
  completedAt?: string | null;
  estimatedWaitMins?: number | null;
  priorityType: string;
  skipCount: number;
  phoneNumber?: string | null;
  
  // Relations
  serviceId: number;
  service?: Service;
  counterId: number | null;
  counter?: Counter;
  createdByUserId: number | null;
  createdByUser?: User;
  servedByUserId: number | null;
  servedByUser?: User;
}

export interface PriorityGroup {
  id: number;
  name: string;
  label: string;
  shortLabel?: string | null;
  weight: number;
  slaThreshold?: number | null;
  isActive: boolean;
}

export interface Settings {
  id: number;
  websiteName: string;
  logoBase64?: string | null;
  autoAdaptive: boolean;
  autoBalanceThreshold: number;
  slaThreshold: number;
  zipperRatio: number;
  agingRate: number;
  skipLimit: number;
  ticketHeaderText: string;
  ticketFooterText: string;
  showWaitTimeOnTicket: boolean;
  enableVoiceCall: boolean;
  enableChime: boolean;
  displayTickerText: string;
}
