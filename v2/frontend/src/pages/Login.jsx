import {
  ArrowRight,
  GraduationCap,
  Lock,
  Mail,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const DEMO_ACCOUNTS = [
  {
    role: 'Student',
    name: 'Rahul Sharma',
    sub: 'CS • CGPA 8.4',
    email: 'rahul@student.talenthub.edu',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    role: 'Student',
    name: 'Priya Nair',
    sub: 'IT • CGPA 9.2',
    email: 'priya@student.talenthub.edu',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    role: 'Student',
    name: 'Sneha Patil',
    sub: 'Mech • CGPA 7.9',
    email: 'sneha@student.talenthub.edu',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    role: 'Company',
    name: 'ABC Technologies',
    sub: 'Product Software (9.5 LPA)',
    email: 'hr@abctech.com',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    role: 'Company',
    name: 'Apex Quant Solutions',
    sub: 'Dream Tier Fintech (24 LPA)',
    email: 'recruiter@apexquant.com',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    role: 'Coordinator',
    name: 'Placement Officer',
    sub: 'Administrative Authority',
    email: 'coordinator@talenthub.edu',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
  },
];

export default function Login() {
  const [email, setEmail] = useState('rahul@student.talenthub.edu');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await client.post('/auth/login', { email, password });
      login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          'Authentication failed. Please verify credentials or contact administrator.'
      );
    } finally {
      setLoading(false);
    }
  };

  const selectDemoAccount = (accEmail) => {
    setEmail(accEmail);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-indigo-50/30 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-100 mb-4">
          <GraduationCap className="w-8 h-8" />
        </div>
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">TalentHub</h1>
          <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            v2.0
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Campus Placement & Corporate Recruitment Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-slate-200/90 py-8 px-6 shadow-xl shadow-slate-200/50 rounded-3xl sm:px-10 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Institutional / Corporate Email
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
                  placeholder="name@university.edu"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <span className="font-semibold">Error:</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-100 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Selector */}
          <div className="border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Demo Evaluation Accounts
              </span>
              <span className="text-[10px] text-slate-400 font-mono">password123</span>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => selectDemoAccount(acc.email)}
                  className={`text-left p-2.5 rounded-xl border transition flex items-center justify-between group ${
                    email === acc.email
                      ? 'bg-indigo-50/60 border-indigo-300 shadow-sm'
                      : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition truncate">
                      {acc.name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{acc.sub}</div>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${acc.badge}`}
                  >
                    {acc.role}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Registration link */}
          <div className="border-t border-slate-100 pt-4 text-center">
            <Link
              to="/register"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-1.5 transition"
            >
              <UserPlus className="w-4 h-4" /> New Student or Company? Create an Account &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
