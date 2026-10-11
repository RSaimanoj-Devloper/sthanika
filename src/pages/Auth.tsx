import { FormEvent, ReactNode, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Shield, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { demoPassword, mockUsers } from '../data/mock';
import { UserRole } from '../types';

const demoAccounts = (['ADMIN', 'MERCHANT', 'USER'] as UserRole[]).map((role) => {
  const user = mockUsers.find((u) => u.role === role && u.status === 'ACTIVE')!;
  return { role, email: user.email, password: demoPassword(role) };
});

function AuthShell({ icon, accent, eyebrow, title, width, children }: {
  icon: ReactNode; accent: string; eyebrow: string; title: string; width: string; children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 dark:bg-slate-950">
      <div className={`w-full ${width} rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-700 dark:bg-slate-900`}>
        <div className="mb-6 flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg ${accent}`}>{icon}</div>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{eyebrow}</p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

const ErrorBox = ({ message }: { message: string }) => (
  <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
    {message}
  </div>
);

function PasswordField({ value, onChange, placeholder, icon }: { value: string; onChange: (v: string) => void; placeholder: string; icon?: boolean }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      {icon && <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
      <input
        type={visible ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} className={`input-field pr-10 ${icon ? 'pl-10' : ''}`} required
        autoComplete={icon ? 'current-password' : 'new-password'}
      />
      <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { logEvent } = useData();
  const [email, setEmail] = useState(demoAccounts[0].email);
  const [password, setPassword] = useState(demoAccounts[0].password);
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    try {
      const user = login(email, password);
      logEvent({ type: 'AUTH_LOGIN', actor: user, entity: 'User', entityId: user.id, description: `${user.name} signed in` });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    }
  };

  return (
    <AuthShell icon={<Shield className="h-6 w-6" />} accent="bg-indigo-600" eyebrow="Welcome back" title="Sthānika Login" width="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className={labelClass}>Email</span>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-10" autoComplete="username" required />
          </div>
        </label>
        <label className="block">
          <span className={labelClass}>Password</span>
          <PasswordField value={password} onChange={setPassword} placeholder="Enter password" icon />
        </label>
        {error && <ErrorBox message={error} />}
        <button type="submit" className="btn-primary w-full justify-center">Sign in</button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Need an account?{' '}
        <Link to="/signup" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">Create one</Link>
      </p>

      <div className="mt-5 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
        <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">Demo accounts — click to fill</p>
        <div className="flex gap-2">
          {demoAccounts.map((account) => (
            <button
              key={account.role} type="button"
              onClick={() => { setEmail(account.email); setPassword(account.password); setError(''); }}
              className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold capitalize text-slate-700 transition-colors hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
            >
              {account.role.toLowerCase()}
            </button>
          ))}
        </div>
      </div>
    </AuthShell>
  );
}

export function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { registerDevice, registerMerchant } = useData();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'USER' | 'MERCHANT'>('USER');
  const [storeName, setStoreName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    try {
      const user = signup({ name, email, password, role });
      registerDevice(user);
      if (role === 'MERCHANT') registerMerchant(user, storeName);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account.');
    }
  };

  return (
    <AuthShell icon={<UserIcon className="h-6 w-6" />} accent="bg-emerald-600" eyebrow="New account" title="Create profile" width="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className={labelClass}>Full name</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" className="input-field" required />
        </label>
        <label className="block">
          <span className={labelClass}>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input-field" required />
        </label>
        <label className="block">
          <span className={labelClass}>Password</span>
          <PasswordField value={password} onChange={setPassword} placeholder="At least 6 characters" />
        </label>
        <label className="block">
          <span className={labelClass}>Account type</span>
          <select value={role} onChange={(e) => setRole(e.target.value as 'USER' | 'MERCHANT')} className="select-field w-full">
            <option value="USER">User</option>
            <option value="MERCHANT">Merchant</option>
          </select>
        </label>
        {role === 'MERCHANT' && (
          <label className="block">
            <span className={labelClass}>Store name</span>
            <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="e.g. Sharma Kirana Store" className="input-field" required />
          </label>
        )}
        {error && <ErrorBox message={error} />}
        <button type="submit" className="btn-primary w-full justify-center">Create account</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">Sign in</Link>
      </p>
    </AuthShell>
  );
}
