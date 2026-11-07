import {
  ArrowRight,
  Bus,
  CheckCircle2,
  Coffee,
  CreditCard,
  FileCheck,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Store,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const DEMO_ACCOUNTS = [
  {
    role: 'Student (Basic)',
    name: 'Rahul Sharma',
    sub: 'BASIC Tier • 1.0× Multiplier',
    email: 'rahul@student.finpay.edu',
    badge: 'bg-slate-700/60 text-slate-300 border-slate-600',
    icon: CreditCard,
  },
  {
    role: 'Student (Prime)',
    name: 'Priya Nair',
    sub: 'PRIME Tier • 1.5× Multiplier',
    email: 'priya@student.finpay.edu',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    icon: Sparkles,
  },
  {
    role: 'Student (Premium)',
    name: 'Sneha Patil',
    sub: 'PREMIUM Tier • 2.0× Multiplier',
    email: 'sneha@student.finpay.edu',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    icon: Sparkles,
  },
  {
    role: 'Merchant POS',
    name: 'Campus Canteen',
    sub: 'Canteen POS Terminal',
    email: 'canteen@merchants.finpay.edu',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    icon: Coffee,
  },
  {
    role: 'Auditor',
    name: 'Campus Finance Auditor',
    sub: 'Ledger Reconciliation Authority',
    email: 'auditor@finpay.edu',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    icon: FileCheck,
  },
];

export default function Login() {
  const [email, setEmail] = useState('rahul@student.finpay.edu');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await client.post('/auth/login', { email, password });
      login(res.data);

      if (res.data.role === 'MERCHANT') {
        navigate('/merchant');
      } else if (res.data.role === 'AUDITOR') {
        navigate('/reconciliation');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err?.response?.data?.detail || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const selectAccount = (accEmail) => {
    setEmail(accEmail);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#080C14] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-xl shadow-emerald-500/20 mb-4">
          <Sparkles className="w-7 h-7" />
        </div>
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-3xl font-black text-white tracking-tight">FinPay</h1>
          <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Core 1.0
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Campus Digital Wallet & Precision Cashback System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[#0F1626] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Quick Demo Switcher */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
              <span>Quick Demo Personas</span>
              <span className="text-[10px] text-emerald-400">1-Click Auto-Fill</span>
            </div>

            <div className="space-y-1.5">
              {DEMO_ACCOUNTS.map((acc) => {
                const Icon = acc.icon;
                const isSelected = email === acc.email;

                return (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => selectAccount(acc.email)}
                    className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#16213A] border-emerald-500/80 shadow-md shadow-emerald-500/10'
                        : 'bg-[#0B0F19] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-white">{acc.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{acc.sub}</div>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${acc.badge}`}
                    >
                      {acc.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 pt-2 border-t border-slate-800">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1">
                Account Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : 'Sign In to FinPay'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
