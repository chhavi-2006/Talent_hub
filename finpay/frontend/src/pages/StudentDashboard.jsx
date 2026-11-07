import {
  ArrowDownLeft,
  ArrowUpRight,
  Bus,
  CheckCircle2,
  Clock,
  Coffee,
  CreditCard,
  Layers,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import client from '../api/client.js';
import CashbackGauge from '../components/CashbackGauge.jsx';
import QuickPayModal from '../components/QuickPayModal.jsx';
import TierUpgradeModal from '../components/TierUpgradeModal.jsx';
import TopUpModal from '../components/TopUpModal.jsx';
import TransactionTable from '../components/TransactionTable.jsx';
import VirtualCard from '../components/VirtualCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function StudentDashboard() {
  const { user, wallet, refreshWallet } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showPayModal, setShowPayModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showTierModal, setShowTierModal] = useState(false);
  const [toast, setToast] = useState(null);

  const loadTransactions = async () => {
    try {
      const res = await client.get('/payments/history?limit=50');
      setTransactions(res.data);
    } catch (err) {
      console.error('Failed to load transaction history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handlePaymentSuccess = async (receipt) => {
    await refreshWallet();
    await loadTransactions();
    setToast({
      type: 'success',
      text: `Paid ₹${receipt.amount_inr} to ${receipt.merchant_name}. Cashback: +₹${receipt.actual_cashback_inr}`,
    });
  };

  const handleTopUpSuccess = async (res) => {
    await refreshWallet();
    await loadTransactions();
    setToast({
      type: 'success',
      text: `Wallet loaded with ₹${res.amount_inr} successfully!`,
    });
  };

  const tier = wallet?.tier || user?.wallet_tier || 'BASIC';
  const mult = tier === 'PREMIUM' ? '2.0×' : tier === 'PRIME' ? '1.5×' : '1.0×';

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Alert */}
      {toast && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{toast.text}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-xs text-slate-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <div className="bg-[#0F1626] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">
              Hello, {user?.name || 'Student'} 👋
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Active Member
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Campus digital wallet with real-time multi-tier category cashback and financial safety
          </p>
        </div>

        {/* Tier Multiplier Pill */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-2xl bg-[#0B0F19] border border-slate-800 flex items-center gap-3 font-mono text-xs">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">
                Wallet Multiplier
              </span>
              <span className="text-emerald-400 font-bold">{mult} Cashback Rate</span>
            </div>
            <button
              onClick={() => setShowTierModal(true)}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition"
            >
              Simulate Tier
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Virtual Card & Overview Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Interactive Virtual Card */}
        <div className="lg:col-span-1">
          <VirtualCard
            wallet={wallet}
            user={user}
            onOpenPay={() => setShowPayModal(true)}
            onOpenTopUp={() => setShowTopUpModal(true)}
            onOpenTierModal={() => setShowTierModal(true)}
          />
        </div>

        {/* Right: Quick Highlights & Rules Cheat Sheet */}
        <div className="lg:col-span-2 bg-[#0F1626] border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" /> FinPay Tier Advantages
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              Current: <strong className="text-emerald-400">{tier}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3.5 bg-[#0B0F19] border border-slate-800/80 rounded-2xl space-y-1">
              <div className="text-slate-400 text-[11px]">Canteen Cashback</div>
              <div className="text-lg font-bold text-emerald-400">
                {tier === 'PREMIUM' ? '4.0%' : tier === 'PRIME' ? '3.0%' : '2.0%'}
              </div>
              <div className="text-[10px] text-slate-500">
                Cap: ₹{tier === 'PREMIUM' ? '100' : tier === 'PRIME' ? '75' : '50'}/mo
              </div>
            </div>

            <div className="p-3.5 bg-[#0B0F19] border border-slate-800/80 rounded-2xl space-y-1">
              <div className="text-slate-400 text-[11px]">Transport & Shuttle</div>
              <div className="text-lg font-bold text-indigo-400">
                {tier === 'PREMIUM' ? '6.0%' : tier === 'PRIME' ? '4.5%' : '3.0%'}
              </div>
              <div className="text-[10px] text-slate-500">
                Cap: ₹{tier === 'PREMIUM' ? '200' : tier === 'PRIME' ? '150' : '100'}/mo
              </div>
            </div>

            <div className="p-3.5 bg-[#0B0F19] border border-slate-800/80 rounded-2xl space-y-1">
              <div className="text-slate-400 text-[11px]">Stationery & Books</div>
              <div className="text-lg font-bold text-blue-400">
                {tier === 'PREMIUM' ? '2.0%' : tier === 'PRIME' ? '1.5%' : '1.0%'}
              </div>
              <div className="text-[10px] text-slate-500">
                Cap: ₹{tier === 'PREMIUM' ? '40' : tier === 'PRIME' ? '30' : '20'}/mo
              </div>
            </div>
          </div>

          <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Double-click safety: All payments are guarded with idempotency hashing.</span>
            </div>
            <button
              onClick={() => setShowPayModal(true)}
              className="text-emerald-400 hover:text-emerald-300 font-bold underline font-mono text-[11px] shrink-0"
            >
              Pay a Merchant →
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Category Cashback Limit Gauges */}
      <CashbackGauge limits={wallet?.limits_summary || []} tier={tier} />

      {/* Transaction Ledger Table */}
      <TransactionTable
        transactions={transactions}
        onRefresh={() => {
          refreshWallet();
          loadTransactions();
        }}
      />

      {/* Modals */}
      <QuickPayModal
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        wallet={wallet}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <TopUpModal
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        onTopUpSuccess={handleTopUpSuccess}
      />

      <TierUpgradeModal
        isOpen={showTierModal}
        onClose={() => setShowTierModal(false)}
      />
    </div>
  );
}
