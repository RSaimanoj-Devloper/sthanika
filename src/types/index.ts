export type UserRole = 'USER' | 'MERCHANT' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  publicKey: string;
  status: UserStatus;
  registeredAt: string;
}

export type DeviceStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED';

export interface Device {
  id: string;
  name: string;
  userId: string;
  userName: string;
  publicKey: string;
  status: DeviceStatus;
  lastSeen: string;
  registeredAt: string;
  platform: string;
}

export type MessageStatus = 'QUEUED' | 'SENT' | 'RELAYED' | 'DELIVERED' | 'FAILED';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  status: MessageStatus;
  hops: number;
  ttl: number;
  timestamp: string;
}

export type TransactionStatus = 'ACCEPTED' | 'REJECTED' | 'CONFLICT' | 'RECONCILED' | 'PENDING';
export type SyncStatus = 'SYNCED' | 'PENDING' | 'FAILED';

export interface Transaction {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  merchantId: string;
  merchantName: string;
  amount: number;
  status: TransactionStatus;
  syncStatus: SyncStatus;
  timestamp: string;
  tokens: number;
}

export type MerchantStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

export interface Merchant {
  id: string;
  businessName: string;
  code: string;
  userId: string;
  userName: string;
  status: MerchantStatus;
  qrId: string;
  createdAt: string;
}

export type SyncEventStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CONFLICT';
export type EntityType = 'USER' | 'DEVICE' | 'MESSAGE' | 'TRANSACTION' | 'MERCHANT' | 'TOKEN';
export type OperationType = 'CREATE' | 'UPDATE' | 'DELETE' | 'SYNC' | 'MERGE';

export interface SyncEvent {
  id: string;
  deviceId: string;
  deviceName: string;
  entityType: EntityType;
  entityId?: string;
  operation: OperationType;
  status: SyncEventStatus;
  attempts: number;
  timestamp: string;
}

export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SecurityEventType =
  | 'AUTH_LOGIN'
  | 'AUTH_LOGOUT'
  | 'DEVICE_REGISTERED'
  | 'DEVICE_BANNED'
  | 'SECURITY_ALERT'
  | 'TOKEN_CONFLICT'
  | 'UNAUTHORIZED_ACCESS'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SIGNATURE_MISMATCH';

export interface SecurityEvent {
  id: string;
  userId: string;
  userName: string;
  deviceId: string;
  deviceName: string;
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  description: string;
  timestamp: string;
  ipAddress: string;
  resolved: boolean;
}

export type AuditEventType =
  | 'AUTH_LOGIN'
  | 'AUTH_LOGOUT'
  | 'MESSAGE_SENT'
  | 'MESSAGE_DELIVERED'
  | 'PAYMENT_INITIATED'
  | 'PAYMENT_ACCEPTED'
  | 'PAYMENT_REJECTED'
  | 'SYNC_STARTED'
  | 'SYNC_COMPLETED'
  | 'SYNC_CONFLICT'
  | 'DEVICE_REGISTERED'
  | 'DEVICE_BANNED'
  | 'SECURITY_ALERT'
  | 'TOKEN_SPENT'
  | 'TOKEN_CONFLICT'
  | 'USER_STATUS_CHANGED'
  | 'MERCHANT_STATUS_CHANGED';

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  deviceName: string;
  eventType: AuditEventType;
  relatedEntity: string;
  relatedEntityId: string;
  description: string;
  timestamp: string;
}

export interface DailyMetric {
  date: string;
  messages: number;
  transactions: number;
}

export interface WeeklySyncMetric {
  week: string;
  success: number;
  failed: number;
  conflict: number;
}
