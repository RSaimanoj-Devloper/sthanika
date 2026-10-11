import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { demoPassword, mockUsers, newId, newPhone, newPublicKey } from '../data/mock';
import { User, UserRole, UserStatus } from '../types';

// Demo-only auth: accounts live in localStorage in plain text. Replace with a real backend before shipping.
export type AppUser = User & { password: string };

const USERS_KEY = 'sthanika-users-v2';
const SESSION_KEY = 'sthanika-session-v2';

const seedUsers = (): AppUser[] => mockUsers.map((user) => ({ ...user, password: demoPassword(user.role) }));

function load<T>(key: string, fallback: T): T {
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

interface SignupPayload {
  name: string;
  email: string;
  password: string;
  role: Exclude<UserRole, 'ADMIN'>;
}

interface AuthContextValue {
  users: AppUser[];
  currentUser: AppUser | null;
  login: (email: string, password: string) => AppUser;
  signup: (payload: SignupPayload) => AppUser;
  logout: () => void;
  setUserStatus: (id: string, status: UserStatus) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>(() => {
    const stored = load<AppUser[]>(USERS_KEY, []);
    return stored.length ? stored : seedUsers();
  });
  const [sessionId, setSessionId] = useState<string | null>(() => load<string | null>(SESSION_KEY, null));

  // The session only stores an id; the user is always read from the live list,
  // so status changes apply immediately and no password sits in the session.
  const currentUser = useMemo(() => {
    const found = users.find((user) => user.id === sessionId);
    return found && found.status === 'ACTIVE' ? found : null;
  }, [users, sessionId]);

  useEffect(() => {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (sessionId) window.localStorage.setItem(SESSION_KEY, JSON.stringify(sessionId));
    else window.localStorage.removeItem(SESSION_KEY);
  }, [sessionId]);

  const login = useCallback((email: string, password: string) => {
    const normalized = email.trim().toLowerCase();
    const found = users.find((user) => user.email.toLowerCase() === normalized && user.password === password);
    if (!found) throw new Error('Invalid email or password.');
    if (found.status !== 'ACTIVE') {
      throw new Error(`This account is ${found.status.toLowerCase()}. Contact an administrator.`);
    }
    setSessionId(found.id);
    return found;
  }, [users]);

  const signup = useCallback(({ name, email, password, role }: SignupPayload) => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedName || !trimmedEmail) throw new Error('Please complete all fields.');
    if (password.length < 6) throw new Error('Password must be at least 6 characters.');
    if (users.some((user) => user.email.toLowerCase() === trimmedEmail)) {
      throw new Error('An account with this email already exists.');
    }
    const created: AppUser = {
      id: newId('usr'),
      name: trimmedName,
      email: trimmedEmail,
      phone: newPhone(),
      role,
      publicKey: newPublicKey(),
      status: 'ACTIVE',
      registeredAt: new Date().toISOString(),
      password,
    };
    setUsers((prev) => [...prev, created]);
    setSessionId(created.id);
    return created;
  }, [users]);

  const logout = useCallback(() => setSessionId(null), []);

  const setUserStatus = useCallback((id: string, status: UserStatus) => {
    setUsers((prev) => prev.map((user) => (user.id === id ? { ...user, status } : user)));
  }, []);

  const value = useMemo(
    () => ({ users, currentUser, login, signup, logout, setUserStatus }),
    [users, currentUser, login, signup, logout, setUserStatus],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
