import { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import { LoginPage, SignupPage } from './pages/Auth';
import RoleOverview from './pages/RoleOverview';
import Users from './pages/Users';
import Devices from './pages/Devices';
import Messages from './pages/Messages';
import Transactions from './pages/Transactions';
import Merchants from './pages/Merchants';
import Synchronization from './pages/Synchronization';
import Security from './pages/Security';
import Analytics from './pages/Analytics';
import AuditLogs from './pages/AuditLogs';
import { UserRole } from './types';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  return currentUser ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  return currentUser ? <Navigate to="/" replace /> : <>{children}</>;
}

function RoleRoute({ allowed, children }: { allowed: UserRole[]; children: ReactNode }) {
  const { currentUser } = useAuth();
  return currentUser && allowed.includes(currentUser.role) ? <>{children}</> : <Navigate to="/" replace />;
}

const adminOnly: UserRole[] = ['ADMIN'];
const adminPages: [string, ReactNode][] = [
  ['users', <Users />], ['devices', <Devices />], ['messages', <Messages />],
  ['synchronization', <Synchronization />], ['security', <Security />],
  ['analytics', <Analytics />], ['audit-logs', <AuditLogs />],
];

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
                <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route index element={<RoleOverview />} />
                  {adminPages.map(([path, page]) => (
                    <Route key={path} path={path} element={<RoleRoute allowed={adminOnly}>{page}</RoleRoute>} />
                  ))}
                  <Route path="transactions" element={<Transactions />} />
                  <Route path="merchants" element={<RoleRoute allowed={['ADMIN', 'MERCHANT']}><Merchants /></RoleRoute>} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
