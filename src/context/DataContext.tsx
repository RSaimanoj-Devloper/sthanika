import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  mockAuditLogs, mockDevices, mockMerchants, mockSecurityEvents, mockSyncEvents,
  mockTransactions, newId, newPublicKey, securityDescriptions,
} from '../data/mock';
import { AuditEventType, AuditLog, Device, DeviceStatus, Merchant, MerchantStatus, SecurityEvent, SyncEvent, Transaction, User } from '../types';

const STORAGE_KEY = 'sthanika-data-v2';

interface DataState {
  devices: Device[];
  merchants: Merchant[];
  transactions: Transaction[];
  syncEvents: SyncEvent[];
  securityEvents: SecurityEvent[];
  auditLogs: AuditLog[];
}

const seedState = (): DataState => ({
  devices: mockDevices,
  merchants: mockMerchants,
  transactions: mockTransactions,
  syncEvents: mockSyncEvents,
  securityEvents: mockSecurityEvents,
  auditLogs: mockAuditLogs,
});

function loadState(): DataState {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? { ...seedState(), ...(JSON.parse(stored) as Partial<DataState>) } : seedState();
  } catch {
    return seedState();
  }
}


/** Works out which pending transactions and queued sync events a sync run would settle. */
function planSync(s: DataState, scope?: (tx: Transaction) => boolean) {
  const txIds = new Set(
    s.transactions.filter((tx) => tx.status === 'PENDING' && (!scope || scope(tx))).map((tx) => tx.id),
  );
  const isQueued = (e: SyncEvent) =>
    (e.status === 'PENDING' || e.status === 'PROCESSING') &&
    (!scope || (e.entityId !== undefined && txIds.has(e.entityId)));
  return { txIds, isQueued, count: Math.max(s.syncEvents.filter(isQueued).length, txIds.size) };
}

interface LogInput {
  type: AuditEventType;
  actor: Pick<User, 'id' | 'name'>;
  entity: string;
  entityId: string;
  description: string;
}

interface DataContextValue extends DataState {
  logEvent: (input: LogInput) => void;
  setDeviceStatus: (id: string, status: DeviceStatus, actor: User) => void;
  setMerchantStatus: (id: string, status: MerchantStatus, actor: User) => void;
  registerMerchant: (owner: User, businessName: string) => Merchant;
  registerDevice: (owner: User) => void;
  createTransaction: (sender: User, merchantId: string, amount: number) => Transaction;
  /** Sync queued items. Pass a predicate to limit it to some transactions; returns how many were synced. */
  processSyncQueue: (actor: User, scope?: (tx: Transaction) => boolean) => number;
  retrySync: (id: string, actor: User) => void;
  resolveSecurityEvents: (ids: string[]) => void;
  resetData: () => void;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataState>(loadState);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const patch = useCallback((update: (prev: DataState) => Partial<DataState>) => {
    setState((prev) => ({ ...prev, ...update(prev) }));
  }, []);

  const makeLog = (prev: DataState, input: LogInput): AuditLog => ({
    id: newId('aud'),
    userId: input.actor.id,
    userName: input.actor.name,
    deviceName: prev.devices.find((d) => d.userId === input.actor.id)?.name ?? 'Web console',
    eventType: input.type,
    relatedEntity: input.entity,
    relatedEntityId: input.entityId,
    description: input.description,
    timestamp: new Date().toISOString(),
  });

  const logEvent = useCallback((input: LogInput) => {
    patch((prev) => ({ auditLogs: [makeLog(prev, input), ...prev.auditLogs] }));
  }, [patch]);

  const setDeviceStatus = useCallback((id: string, status: DeviceStatus, actor: User) => {
    patch((prev) => {
      const device = prev.devices.find((d) => d.id === id);
      if (!device) return {};
      const next: Partial<DataState> = {
        devices: prev.devices.map((d) => (d.id === id ? { ...d, status } : d)),
        auditLogs: [
          makeLog(prev, {
            type: status === 'BANNED' ? 'DEVICE_BANNED' : 'DEVICE_REGISTERED',
            actor, entity: 'Device', entityId: id,
            description: `${actor.name} set ${device.name} to ${status.toLowerCase()}`,
          }),
          ...prev.auditLogs,
        ],
      };
      if (status === 'BANNED') {
        next.securityEvents = [{
          id: newId('sec'), userId: device.userId, userName: device.userName,
          deviceId: device.id, deviceName: device.name, eventType: 'DEVICE_BANNED',
          severity: 'HIGH', description: securityDescriptions.DEVICE_BANNED,
          timestamp: new Date().toISOString(), ipAddress: '10.0.0.1', resolved: false,
        }, ...prev.securityEvents];
      }
      return next;
    });
  }, [patch]);

  const setMerchantStatus = useCallback((id: string, status: MerchantStatus, actor: User) => {
    patch((prev) => {
      const merchant = prev.merchants.find((m) => m.id === id);
      if (!merchant) return {};
      return {
        merchants: prev.merchants.map((m) => (m.id === id ? { ...m, status } : m)),
        auditLogs: [
          makeLog(prev, {
            type: 'MERCHANT_STATUS_CHANGED', actor, entity: 'Merchant', entityId: id,
            description: `${actor.name} set ${merchant.businessName} to ${status.toLowerCase()}`,
          }),
          ...prev.auditLogs,
        ],
      };
    });
  }, [patch]);

  const registerMerchant = useCallback((owner: User, businessName: string) => {
    const merchant: Merchant = {
      id: newId('mer'),
      businessName: businessName.trim() || `${owner.name.split(' ')[0]}'s Store`,
      code: `${businessName.trim().slice(0, 3).toUpperCase() || 'STR'}${String(Date.now()).slice(-3)}`,
      userId: owner.id,
      userName: owner.name,
      status: 'PENDING',
      qrId: newId('qr'),
      createdAt: new Date().toISOString(),
    };
    patch((prev) => ({ merchants: [...prev.merchants, merchant] }));
    return merchant;
  }, [patch]);

  const registerDevice = useCallback((owner: User) => {
    const now = new Date().toISOString();
    const device: Device = {
      id: newId('dev'), name: `${owner.name.split(' ')[0]}-Web-01`, userId: owner.id, userName: owner.name,
      publicKey: newPublicKey(), status: 'ACTIVE', lastSeen: now, registeredAt: now, platform: 'Web',
    };
    patch((prev) => ({
      devices: [...prev.devices, device],
      auditLogs: [
        makeLog(prev, { type: 'DEVICE_REGISTERED', actor: owner, entity: 'Device', entityId: device.id, description: `${owner.name} registered ${device.name}` }),
        ...prev.auditLogs,
      ],
    }));
  }, [patch]);

  const createTransaction = useCallback((sender: User, merchantId: string, amount: number) => {
    const merchant = state.merchants.find((m) => m.id === merchantId);
    if (!merchant) throw new Error('Choose a merchant.');
    if (merchant.status !== 'ACTIVE') throw new Error(`${merchant.businessName} is ${merchant.status.toLowerCase()} and cannot accept payments.`);
    if (merchant.userId === sender.id) throw new Error('You cannot pay your own store.');
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter an amount greater than zero.');

    const tx: Transaction = {
      id: newId('tx'),
      senderId: sender.id, senderName: sender.name,
      receiverId: merchant.userId, receiverName: merchant.userName,
      merchantId: merchant.id, merchantName: merchant.businessName,
      amount: Math.round(amount), status: 'PENDING', syncStatus: 'PENDING',
      timestamp: new Date().toISOString(), tokens: Math.max(1, Math.floor(amount / 100)),
    };

    patch((prev) => {
      const device = prev.devices.find((d) => d.userId === sender.id);
      const syncEvent: SyncEvent = {
        id: newId('syn'), deviceId: device?.id ?? 'web', deviceName: device?.name ?? 'Web console',
        entityType: 'TRANSACTION', entityId: tx.id, operation: 'CREATE', status: 'PENDING',
        attempts: 0, timestamp: tx.timestamp,
      };
      return {
        transactions: [tx, ...prev.transactions],
        syncEvents: [syncEvent, ...prev.syncEvents],
        auditLogs: [
          makeLog(prev, { type: 'PAYMENT_INITIATED', actor: sender, entity: 'Transaction', entityId: tx.id, description: `${sender.name} initiated ₹${tx.amount.toLocaleString('en-IN')} to ${merchant.businessName}` }),
          ...prev.auditLogs,
        ],
      };
    });
    return tx;
  }, [state.merchants, patch]);

  const processSyncQueue = useCallback((actor: User, scope?: (tx: Transaction) => boolean) => {
    const plan = planSync(state, scope);
    if (!plan.count) return 0;
    patch((prev) => {
      const { txIds, isQueued } = planSync(prev, scope);
      return {
        transactions: prev.transactions.map((tx) => (txIds.has(tx.id) ? { ...tx, status: 'ACCEPTED', syncStatus: 'SYNCED' } : tx)),
        syncEvents: prev.syncEvents.map((e) => (isQueued(e) ? { ...e, status: 'SUCCESS', attempts: e.attempts + 1 } : e)),
        auditLogs: [
          makeLog(prev, { type: 'SYNC_COMPLETED', actor, entity: 'SyncEvent', entityId: 'queue', description: `${actor.name} synced ${plan.count} queued item${plan.count === 1 ? '' : 's'}` }),
          ...prev.auditLogs,
        ],
      };
    });
    return plan.count;
  }, [state, patch]);

  const retrySync = useCallback((id: string, actor: User) => {
    patch((prev) => {
      const event = prev.syncEvents.find((e) => e.id === id);
      if (!event) return {};
      return {
        syncEvents: prev.syncEvents.map((e) => (e.id === id ? { ...e, status: 'SUCCESS', attempts: e.attempts + 1 } : e)),
        transactions: prev.transactions.map((tx) =>
          tx.id === event.entityId && tx.status === 'CONFLICT' ? { ...tx, status: 'RECONCILED', syncStatus: 'SYNCED' } : tx),
        auditLogs: [
          makeLog(prev, { type: 'SYNC_COMPLETED', actor, entity: 'SyncEvent', entityId: id, description: `${actor.name} retried a ${event.entityType.toLowerCase()} sync from ${event.deviceName}` }),
          ...prev.auditLogs,
        ],
      };
    });
  }, [patch]);

  const resolveSecurityEvents = useCallback((ids: string[]) => {
    patch((prev) => ({
      securityEvents: prev.securityEvents.map((e) => (ids.includes(e.id) ? { ...e, resolved: true } : e)),
    }));
  }, [patch]);

  const resetData = useCallback(() => setState(seedState()), []);

  const value = useMemo(() => ({
    ...state, logEvent, setDeviceStatus, setMerchantStatus, registerMerchant, registerDevice,
    createTransaction, processSyncQueue, retrySync, resolveSecurityEvents, resetData,
  }), [state, logEvent, setDeviceStatus, setMerchantStatus, registerMerchant, registerDevice,
    createTransaction, processSyncQueue, retrySync, resolveSecurityEvents, resetData]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used inside DataProvider');
  return context;
}
