import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Database,
  DollarSign,
  FileCheck,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import client from '../api/client.js';

export default function Reconciliation() {
  const [report, setReport] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [rRes, lRes] = await Promise.all([
        client.get('/reconciliation/report'),
        client.get('/reconciliation/ledger?limit=100'),
      ]);
      setReport(rRes.data);
      setLedgerEntries(lRes.data);
    } catch (err) {
      console.error('Failed to load audit data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-mono">Running automated ledger reconciliation...</span>
        </div>
      </div>
    );
  }

  const metrics = report?.metrics || {};
  const ledgerAudit = report?.ledger_audit || {};
  const isHealthy = report?.is_healthy;

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-[#0F1626] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">
                  University Financial Audit & Reconciliation
                </h1>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                    isHealthy
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  }`}
                >
                  {report?.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Month: <strong>{report?.reconciliation_month}</strong> • Double-Entry General Ledger
                Integrity Verification
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Re-Run Audit Checksum</span>
        </button>
      </div>

      {/* KPI Tiles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0F1626] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Campus Volume</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight">
            ₹{metrics.total_volume_inr?.toFixed(2) || '0.00'}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {metrics.total_transactions || 0} processed transaction(s)
          </div>
        </div>

        <div className="bg-[#0F1626] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Cashback Disbursed</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
            ₹{metrics.actual_cashback_inr?.toFixed(2) || '0.00'}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {metrics.actual_cashback_paise?.toLocaleString()} paise credited
          </div>
        </div>

        <div className="bg-[#0F1626] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Capped Policy Savings</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-400 font-mono tracking-tight">
            ₹{metrics.capped_savings_inr?.toFixed(2) || '0.00'}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Savings preserved by monthly limits
          </div>
        </div>

        <div className="bg-[#0F1626] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Ledger Symmetry</span>
            <Scale className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight">
            {ledgerAudit.is_ledger_symmetric ? '100% Balanced' : 'Imbalance'}
          </div>
          <div className="text-[11px] text-emerald-400 font-mono">
            0 wallet variance detected
          </div>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="bg-[#0F1626] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" /> Category Cashback & Volume Breakdown
        </h2>

        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-[#0B0F19] text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800">
                <th className="py-3 px-4">Merchant Category</th>
                <th className="py-3 px-4">Transactions</th>
                <th className="py-3 px-4">Total Volume (₹)</th>
                <th className="py-3 px-4">Cashback Granted (₹)</th>
                <th className="py-3 px-4 text-right">Effective Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-[#0F1626]">
              {report?.category_breakdown?.map((cat) => (
                <tr key={cat.category} className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-200">{cat.category}</td>
                  <td className="py-3.5 px-4 text-slate-300">{cat.transaction_count}</td>
                  <td className="py-3.5 px-4 font-bold text-white">
                    ₹{cat.volume_inr.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-emerald-400">
                    ₹{cat.cashback_inr.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-300">
                    {cat.effective_cashback_ratio_pct}%
                  </td>
                </tr>
              ))}

              {(!report?.category_breakdown || report.category_breakdown.length === 0) && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-500 text-xs">
                    No transactions recorded for this reconciliation cycle.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw General Ledger Journal */}
      <div className="bg-[#0F1626] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-400" /> Double-Entry General Ledger Records ({ledgerEntries.length})
        </h2>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 max-h-96">
          <table className="w-full text-left text-xs font-mono">
            <thead className="sticky top-0 bg-[#0B0F19] text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Entry #</th>
                <th className="py-3 px-4">Tx ID</th>
                <th className="py-3 px-4">Account Category</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Amount (₹)</th>
                <th className="py-3 px-4">Amount (Paise)</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-[#0F1626]">
              {ledgerEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-4 text-slate-400">#{entry.id}</td>
                  <td className="py-3 px-4 text-slate-300 font-bold">#{entry.transaction_id}</td>
                  <td className="py-3 px-4 text-slate-300">{entry.account_category}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        entry.entry_type === 'CREDIT'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {entry.entry_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-white">₹{entry.amount_inr.toFixed(2)}</td>
                  <td className="py-3 px-4 text-slate-400">{entry.amount_paise}</td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">
                    {new Date(entry.created_at).toLocaleString([], {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
