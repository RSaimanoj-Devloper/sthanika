import {
  AuditLog, DailyMetric, Device, Merchant, Message, SecurityEvent,
  SyncEvent, Transaction, User, WeeklySyncMetric,
} from '../types';

// Seeded PRNG: the same data (and the same IDs) is generated on every page load,
// so records persisted in localStorage always line up with the seed data.
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(20261011);
const between = (min: number, max: number) => Math.floor(min + random() * (max - min + 1));
const hex = (length: number) => Array.from({ length }, () => between(0, 15).toString(16)).join('');
const seedId = (prefix: string, n: number) => `${prefix}-${String(n).padStart(4, '0')}-${hex(8)}`;

const NOW = Date.now();
const MINUTE = 60_000;
const ago = (minutes: number) => new Date(NOW - minutes * MINUTE).toISOString();
const daysAgo = (n: number) => ago(n * 1440);
const hoursAgo = (n: number) => ago(n * 60);

export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${hex(6)}`;
export const newPublicKey = () => hex(64);
export const newPhone = () => `+91 ${between(7000000000, 9999999999)}`;

// ─── Users ────────────────────────────────────────────────────────────────────

const userSeed: [string, User['role'], User['status'], number][] = [
  ['Aarav Sharma', 'ADMIN', 'ACTIVE', 90],
  ['Priya Patel', 'MERCHANT', 'ACTIVE', 75],
  ['Rohit Gupta', 'USER', 'ACTIVE', 60],
  ['Kavya Nair', 'USER', 'INACTIVE', 55],
  ['Arjun Menon', 'MERCHANT', 'ACTIVE', 50],
  ['Ananya Singh', 'USER', 'ACTIVE', 45],
  ['Vikram Reddy', 'USER', 'SUSPENDED', 40],
  ['Meera Krishnan', 'MERCHANT', 'ACTIVE', 38],
  ['Siddharth Joshi', 'USER', 'ACTIVE', 35],
  ['Pooja Iyer', 'USER', 'ACTIVE', 30],
  ['Rahul Verma', 'ADMIN', 'ACTIVE', 28],
  ['Deepika Rao', 'USER', 'ACTIVE', 25],
  ['Amit Kumar', 'MERCHANT', 'ACTIVE', 22],
  ['Sneha Pillai', 'USER', 'INACTIVE', 20],
  ['Kiran Bhat', 'USER', 'ACTIVE', 18],
  ['Divya Malhotra', 'MERCHANT', 'ACTIVE', 15],
  ['Suresh Agarwal', 'USER', 'ACTIVE', 12],
  ['Lakshmi Devi', 'USER', 'ACTIVE', 10],
  ['Rajesh Tiwari', 'USER', 'SUSPENDED', 7],
  ['Nisha Choudhary', 'MERCHANT', 'ACTIVE', 3],
  ['Hardik Shah', 'USER', 'ACTIVE', 2],
  ['Ritu Saxena', 'USER', 'ACTIVE', 1],
];

export const mockUsers: User[] = userSeed.map(([name, role, status, age], i) => ({
  id: seedId('usr', i + 1),
  name,
  email: `${name.toLowerCase().replace(' ', '.')}${i + 1}@sthanika.local`,
  phone: newPhone(),
  role,
  publicKey: newPublicKey(),
  status,
  registeredAt: daysAgo(age),
}));

export const demoPassword = (role: User['role']) => (role === 'ADMIN' ? 'admin123' : 'sthanika123');

// ─── Devices ──────────────────────────────────────────────────────────────────

const deviceSeed: [DeviceStatusSeed, number, string, string][] = [
  ['ACTIVE', 5, 'Phone', 'Android'], ['ACTIVE', 30, 'Tablet', 'iOS'], ['ACTIVE', 120, 'Phone', 'Android'],
  ['INACTIVE', 14400, 'Phone', 'Android'], ['ACTIVE', 10, 'Phone', 'iOS'], ['ACTIVE', 45, 'Tablet', 'Android'],
  ['BANNED', 7200, 'Phone', 'Android'], ['ACTIVE', 2, 'Phone', 'iOS'], ['ACTIVE', 60, 'Phone', 'Android'],
  ['ACTIVE', 15, 'Phone', 'iOS'], ['ACTIVE', 1, 'Laptop', 'Linux'], ['ACTIVE', 180, 'Phone', 'Android'],
  ['INACTIVE', 11520, 'Phone', 'Android'], ['ACTIVE', 20, 'Phone', 'iOS'], ['ACTIVE', 240, 'Phone', 'Android'],
];
type DeviceStatusSeed = Device['status'];

export const mockDevices: Device[] = deviceSeed.map(([status, seenMinutesAgo, kind, platform], i) => ({
  id: seedId('dev', i + 1),
  name: `${mockUsers[i].name.split(' ')[0]}-${kind}-01`,
  userId: mockUsers[i].id,
  userName: mockUsers[i].name,
  publicKey: newPublicKey(),
  status,
  lastSeen: ago(seenMinutesAgo),
  registeredAt: new Date(new Date(mockUsers[i].registeredAt).getTime() + 1440 * MINUTE).toISOString(),
  platform,
}));

// ─── Merchants (one per merchant-role user) ──────────────────────────────────

const merchantSeed: [string, string, string, Merchant['status'], number][] = [
  ['Priya Patel', 'Patel General Store', 'PGS001', 'ACTIVE', 70],
  ['Arjun Menon', 'Menon Medicals', 'MMD002', 'ACTIVE', 48],
  ['Meera Krishnan', 'Krishnan Café', 'KCA003', 'ACTIVE', 36],
  ['Amit Kumar', 'Kumar Electronics', 'KEL004', 'SUSPENDED', 20],
  ['Divya Malhotra', 'Malhotra Fashion', 'MFA005', 'ACTIVE', 14],
  ['Nisha Choudhary', 'Choudhary Pharmacy', 'CPH006', 'PENDING', 2],
];

export const mockMerchants: Merchant[] = merchantSeed.map(([owner, businessName, code, status, age], i) => {
  const user = mockUsers.find((u) => u.name === owner)!;
  return {
    id: seedId('mer', i + 1),
    businessName,
    code,
    userId: user.id,
    userName: user.name,
    status,
    qrId: seedId('qr', i + 1),
    createdAt: daysAgo(age),
  };
});

// ─── Messages ─────────────────────────────────────────────────────────────────

const messageStatuses: Message['status'][] = ['QUEUED', 'SENT', 'RELAYED', 'DELIVERED', 'FAILED'];

export const mockMessages: Message[] = Array.from({ length: 30 }, (_, i) => {
  const sender = mockUsers[i % mockUsers.length];
  const receiver = mockUsers[(i + 3) % mockUsers.length];
  return {
    id: seedId('msg', i + 1),
    senderId: sender.id,
    senderName: sender.name,
    receiverId: receiver.id,
    receiverName: receiver.name,
    status: messageStatuses[i % messageStatuses.length],
    hops: between(1, 5),
    ttl: between(5, 60),
    timestamp: daysAgo(between(0, 29)),
  };
});

// ─── Transactions ─────────────────────────────────────────────────────────────

const transactionStatuses: Transaction['status'][] = ['ACCEPTED', 'RECONCILED', 'ACCEPTED', 'PENDING', 'REJECTED', 'CONFLICT'];
const syncFor = (status: Transaction['status']): Transaction['syncStatus'] =>
  status === 'PENDING' ? 'PENDING' : status === 'CONFLICT' ? 'FAILED' : 'SYNCED';

const customers = mockUsers.filter((u) => u.role === 'USER');

export const mockTransactions: Transaction[] = Array.from({ length: 40 }, (_, i) => {
  const sender = customers[i % customers.length];
  const merchant = mockMerchants[i % mockMerchants.length];
  const status = transactionStatuses[i % transactionStatuses.length];
  return {
    id: seedId('tx', i + 1),
    senderId: sender.id,
    senderName: sender.name,
    receiverId: merchant.userId,
    receiverName: merchant.userName,
    merchantId: merchant.id,
    merchantName: merchant.businessName,
    amount: between(50, 5000),
    status,
    syncStatus: syncFor(status),
    timestamp: hoursAgo(between(1, 29 * 24)),
    tokens: between(1, 20),
  };
}).sort((a, b) => b.timestamp.localeCompare(a.timestamp));

// ─── Sync events ──────────────────────────────────────────────────────────────

const syncStatuses: SyncEvent['status'][] = ['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CONFLICT', 'SUCCESS'];
const entityTypes: SyncEvent['entityType'][] = ['USER', 'DEVICE', 'MESSAGE', 'TRANSACTION', 'MERCHANT', 'TOKEN'];
const operations: SyncEvent['operation'][] = ['CREATE', 'UPDATE', 'DELETE', 'SYNC', 'MERGE'];

export const mockSyncEvents: SyncEvent[] = Array.from({ length: 30 }, (_, i) => {
  const device = mockDevices[i % mockDevices.length];
  return {
    id: seedId('syn', i + 1),
    deviceId: device.id,
    deviceName: device.name,
    entityType: entityTypes[i % entityTypes.length],
    operation: operations[i % operations.length],
    status: syncStatuses[i % syncStatuses.length],
    attempts: between(1, 4),
    timestamp: hoursAgo(between(1, 29 * 24)),
  };
}).sort((a, b) => b.timestamp.localeCompare(a.timestamp));

// ─── Security events ──────────────────────────────────────────────────────────

const securityTypes: SecurityEvent['eventType'][] = [
  'AUTH_LOGIN', 'AUTH_LOGOUT', 'DEVICE_REGISTERED', 'DEVICE_BANNED', 'SECURITY_ALERT',
  'TOKEN_CONFLICT', 'UNAUTHORIZED_ACCESS', 'RATE_LIMIT_EXCEEDED', 'SIGNATURE_MISMATCH',
];
const severityByType: Record<SecurityEvent['eventType'], SecurityEvent['severity']> = {
  AUTH_LOGIN: 'LOW', AUTH_LOGOUT: 'LOW', DEVICE_REGISTERED: 'LOW', RATE_LIMIT_EXCEEDED: 'MEDIUM',
  DEVICE_BANNED: 'HIGH', TOKEN_CONFLICT: 'HIGH', UNAUTHORIZED_ACCESS: 'HIGH',
  SECURITY_ALERT: 'CRITICAL', SIGNATURE_MISMATCH: 'CRITICAL',
};

export const securityDescriptions: Record<SecurityEvent['eventType'], string> = {
  AUTH_LOGIN: 'User authenticated successfully',
  AUTH_LOGOUT: 'User session terminated',
  DEVICE_REGISTERED: 'New device registered to account',
  DEVICE_BANNED: 'Device flagged and banned',
  SECURITY_ALERT: 'Suspicious activity detected',
  TOKEN_CONFLICT: 'Token double-spend attempt detected',
  UNAUTHORIZED_ACCESS: 'Access denied — unauthorized request',
  RATE_LIMIT_EXCEEDED: 'API rate limit exceeded',
  SIGNATURE_MISMATCH: 'Cryptographic signature verification failed',
};

export const mockSecurityEvents: SecurityEvent[] = Array.from({ length: 24 }, (_, i) => {
  const user = mockUsers[i % mockUsers.length];
  const device = mockDevices[i % mockDevices.length];
  const eventType = securityTypes[i % securityTypes.length];
  const severity = severityByType[eventType];
  return {
    id: seedId('sec', i + 1),
    userId: user.id,
    userName: user.name,
    deviceId: device.id,
    deviceName: device.name,
    eventType,
    severity,
    description: securityDescriptions[eventType],
    timestamp: hoursAgo(i * 3 + 1),
    ipAddress: `192.168.${between(0, 254)}.${between(1, 254)}`,
    // Low-risk events start resolved; HIGH/CRITICAL ones need an admin to act.
    resolved: severity === 'LOW' || (severity === 'MEDIUM' && i % 2 === 0),
  };
});

// ─── Audit logs ───────────────────────────────────────────────────────────────

const auditSeed: [AuditLog['eventType'], string, string][] = [
  ['AUTH_LOGIN', 'User', 'signed in'],
  ['MESSAGE_SENT', 'Message', 'sent an encrypted message'],
  ['PAYMENT_INITIATED', 'Transaction', 'initiated a payment'],
  ['PAYMENT_ACCEPTED', 'Transaction', 'payment accepted by merchant'],
  ['SYNC_STARTED', 'SyncEvent', 'started a mesh sync'],
  ['SYNC_COMPLETED', 'SyncEvent', 'completed a mesh sync'],
  ['MESSAGE_DELIVERED', 'Message', 'message delivered via relay'],
  ['TOKEN_SPENT', 'Token', 'spent an offline token'],
  ['PAYMENT_REJECTED', 'Transaction', 'payment rejected'],
  ['DEVICE_REGISTERED', 'Device', 'registered a new device'],
  ['SYNC_CONFLICT', 'SyncEvent', 'sync conflict detected'],
  ['TOKEN_CONFLICT', 'Token', 'token double-spend flagged'],
  ['SECURITY_ALERT', 'Device', 'raised a security alert'],
  ['AUTH_LOGOUT', 'User', 'signed out'],
];

export const mockAuditLogs: AuditLog[] = Array.from({ length: 40 }, (_, i) => {
  const user = mockUsers[i % mockUsers.length];
  const device = mockDevices[i % mockDevices.length];
  const [eventType, relatedEntity, text] = auditSeed[i % auditSeed.length];
  return {
    id: seedId('aud', i + 1),
    userId: user.id,
    userName: user.name,
    deviceName: device.name,
    eventType,
    relatedEntity,
    relatedEntityId: seedId(relatedEntity.toLowerCase().slice(0, 3), i + 1),
    description: `${user.name} ${text}`,
    timestamp: ago(i * 47 + 3),
  };
});

// ─── Network telemetry (sample series for the trend charts) ──────────────────

export const dailyMetrics: DailyMetric[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(NOW - (29 - i) * 1440 * MINUTE);
  return {
    date: `${d.getDate()}/${d.getMonth() + 1}`,
    messages: between(20, 200),
    transactions: between(5, 100),
  };
});

export const weeklySyncMetrics: WeeklySyncMetric[] = Array.from({ length: 8 }, (_, i) => ({
  week: `W${i + 1}`,
  success: between(30, 150),
  failed: between(2, 22),
  conflict: between(1, 11),
}));
