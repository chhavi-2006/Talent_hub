import {
  ArrowUpRight,
  Check,
  CreditCard,
  Plus,
  QrCode,
  ShieldCheck,
  Sparkles,
  Wifi,
} from 'lucide-react';
import { useState } from 'react';

export default function VirtualCard({
  wallet,
  user,
  onOpenPay,
  onOpenTopUp,
  onOpenTierModal,
}) {
  const [showPaise, setShowPaise] = useState(false);

  const tier = wallet?.tier || user?.wallet_tier || 'BASIC';
  const balancePaise = wallet?.balance_paise ?? user?.balance_paise ?? 0;
  const balanceInr = (balancePaise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const getTierStyles = () => {
    switch (tier) {
      case 'PREMIUM':
        return {
          gradient: 'from-amber-700 via-stone-900 to-black',
          border: 'border-amber-500/40',
          glow: 'glow-gold',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          accentText: 'text-amber-400',
          chipColor: 'bg-gradient-to-tr from-amber-400 to-yellow-200 border-amber-500',
        };
      case 'PRIME':
        return {
          gradient: 'from-indigo-600 via-blue-900 to-slate-950',
          border: 'border-indigo-500/40',
          glow: 'glow-indigo',
          badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
          accentText: 'text-indigo-400',
          chipColor: 'bg-gradient-to-tr from-blue-300 to-indigo-200 border-blue-400',
        };
      case 'BASIC':
      default:
        return {
          gradient: 'from-slate-700 via-slate-800 to-slate-950',
          border: 'border-slate-600/50',
          glow: 'glow-emerald',
          badgeBg: 'bg-slate-700/50 text-slate-300 border-slate-600',
          accentText: 'text-emerald-400',
          chipColor: 'bg-gradient-to-tr from-slate-300 to-slate-100 border-slate-400',
        };
    }
  };

  const styles = getTierStyles();

  return (
    <div className="relative group">
      {/* Background Ambient Glow */}
      <div
        className={`absolute -inset-0.5 rounded-3xl bg-gradient-to-r ${styles.gradient} opacity-40 blur-xl group-hover:opacity-60 transition duration-500`}
      />

      {/* Main Physical Card Surface */}
      <div
        className={`relative rounded-3xl p-6 sm:p-7 border ${styles.border} bg-gradient-to-br ${styles.gradient} shadow-2xl flex flex-col justify-between min-h-[220px] sm:min-h-[240px] overflow-hidden`}
      >
        {/* Holographic Watermark Lines */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.08)_0%,_transparent_60%)] pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.04)_0%,_transparent_70%)] pointer-events-none" />

        {/* Top Header: Brand, Tier Pill & Contactless Icon */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-emerald-400 border border-white/10 shadow-inner">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block leading-none">
                FinPay
              </span>
              <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-400">
                Campus Smart Wallet
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${styles.badgeBg}`}
            >
              {tier} TIER
            </span>
            <Wifi className="w-4 h-4 text-white/50 rotate-90" />
          </div>
        </div>

        {/* Chip & Masked Card Details */}
        <div className="my-3 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            {/* Realistic Golden / Metallic Chip */}
            <div
              className={`w-11 h-8 rounded-lg ${styles.chipColor} border shadow-inner relative flex items-center justify-center overflow-hidden`}
            >
              <div className="w-full h-0.5 bg-black/20 absolute top-2.5" />
              <div className="w-full h-0.5 bg-black/20 absolute bottom-2.5" />
              <div className="h-full w-0.5 bg-black/20 absolute left-3.5" />
              <div className="h-full w-0.5 bg-black/20 absolute right-3.5" />
            </div>
          </div>

          <div className="font-mono text-sm tracking-[0.25em] text-white/70">
            •••• •••• •••• 4289
          </div>
        </div>

        {/* Balance Display & Action Bar */}
        <div className="relative z-10 pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span>Available Liquidity</span>
              <button
                type="button"
                onClick={() => setShowPaise(!showPaise)}
                className="text-[10px] text-slate-500 hover:text-slate-300 underline font-mono"
              >
                {showPaise ? 'Show ₹ INR' : 'Show Paise'}
              </button>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-baseline gap-1 mt-0.5">
              {showPaise ? (
                <>
                  <span className="font-mono text-emerald-400">{balancePaise.toLocaleString('en-IN')}</span>
                  <span className="text-xs text-slate-400 font-mono">paise</span>
                </>
              ) : (
                <>
                  <span className="text-slate-400 text-xl font-normal">₹</span>
                  <span>{balanceInr}</span>
                </>
              )}
            </div>
            <div className="text-xs text-slate-300 font-medium mt-0.5">
              {user?.name || 'Student Wallet'}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenPay}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition active:scale-95"
            >
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Quick Pay</span>
            </button>

            <button
              onClick={onOpenTopUp}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/10 transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Top-Up</span>
            </button>

            <button
              onClick={onOpenTierModal}
              title="Simulate / Upgrade Tier"
              className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 text-xs border border-white/10 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
