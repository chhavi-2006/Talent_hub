import {
  CreditCard,
  FileCheck,
  Layers,
  LogOut,
  ShieldCheck,
  Sparkles,
  Store,
  User,
  Wallet,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, wallet, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  const balancePaise = wallet?.balance_paise ?? user?.balance_paise ?? 0;
  const balanceInr = (balancePaise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const tier = wallet?.tier || user?.wallet_tier || 'BASIC';

  return (
    <header className="border-b border-slate-800 bg-[#0B0F19]/90 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white">FinPay</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Neo-Campus
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block font-mono">
              Digital Wallet & Cashback Core
            </p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2 text-xs font-semibold">
          {user.role === 'STUDENT' && (
            <>
              <Link
                to="/"
                className={`px-3 py-2 rounded-xl flex items-center gap-2 transition ${
                  isActive('/')
                    ? 'bg-[#161F36] text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>My Wallet</span>
              </Link>
            </>
          )}

          {user.role === 'MERCHANT' && (
            <Link
              to="/merchant"
              className={`px-3 py-2 rounded-xl flex items-center gap-2 transition ${
                isActive('/merchant')
                  ? 'bg-[#161F36] text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>POS Billing Terminal</span>
            </Link>
          )}

          {user.role === 'AUDITOR' && (
            <Link
              to="/reconciliation"
              className={`px-3 py-2 rounded-xl flex items-center gap-2 transition ${
                isActive('/reconciliation')
                  ? 'bg-[#161F36] text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Reconciliation & Ledger</span>
            </Link>
          )}
        </nav>

        {/* Right Persona Pill & Logout */}
        <div className="flex items-center gap-3">
          {user.role === 'STUDENT' && (
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-[#0F1626] border border-slate-800 font-mono text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {tier}
              </span>
              <span className="font-bold text-white">₹{balanceInr}</span>
            </div>
          )}

          <div className="text-right hidden md:block">
            <div className="text-xs font-bold text-slate-200">{user.name}</div>
            <div className="text-[10px] text-slate-400 font-mono">{user.email}</div>
          </div>

          <button
            onClick={logout}
            title="Log out"
            className="p-2 rounded-xl bg-[#0F1626] hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
