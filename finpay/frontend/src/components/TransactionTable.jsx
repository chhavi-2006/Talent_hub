import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Filter,
  Layers,
  Sparkles,
  X,
} from 'lucide-react';
import { useState } from 'react';
import client from '../api/client.js';

export default function TransactionTable({ transactions = [], onRefresh }) {
  const [selectedTx, setSelectedTx] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [txDetails, setTxDetails] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const filtered = transactions.filter((t) => {
    if (categoryFilter === 'ALL') return true;
    return t.category === categoryFilter;
  });

  const openDetails = async (tx) => {
    setSelectedTx(tx);
    setDetailLoading(true);
    try {
      const res = await client.get(`/payments/${tx.id}`);
      setTxDetails(res.data);
    } catch (err) {
      console.error('Could not fetch tx details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedTx(null);
    setTxDetails(null);
  };

  return (
    <div className="bg-[#0F1626] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" /> Transaction Ledger History (
            {filtered.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographically audited payments, cashback records, and double-entry journals
          </p>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {['ALL', 'CANTEEN', 'STATIONERY', 'TRANSPORT', 'HOSTEL', 'ONLINE', 'TOP_UP'].map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition text-xs ${
                  categoryFilter === cat
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-[#0B0F19] border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat === 'TOP_UP' ? 'Top-Up' : cat}
              </button>
            )
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#0B0F19] text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800">
              <th className="py-3 px-4">Merchant / Destination</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Gross Charge</th>
              <th className="py-3 px-4">Cashback Granted</th>
              <th className="py-3 px-4">Date & Time</th>
              <th className="py-3 px-4 text-right">Audit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 bg-[#0F1626]">
            {filtered.map((t) => {
              const isTopUp = t.category === 'TOP_UP';

              return (
                <tr key={t.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isTopUp
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-indigo-500/10 text-indigo-400'
                        }`}
                      >
                        {isTopUp ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-100">{t.merchant_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {t.description || 'Payment'}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {t.category}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-white">
                    {isTopUp ? '+' : '-'}₹{t.amount_inr.toFixed(2)}
                  </td>

                  <td className="py-3.5 px-4 font-mono">
                    {t.actual_cashback_paise > 0 ? (
                      <div className="text-emerald-400 font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span>+₹{t.actual_cashback_inr.toFixed(2)}</span>
                        {t.raw_cashback_paise > t.actual_cashback_paise && (
                          <span
                            title={`Raw cashback was ₹${t.raw_cashback_inr.toFixed(2)} but clamped to monthly cap`}
                            className="text-[10px] text-amber-400 ml-1 underline cursor-help"
                          >
                            (Capped)
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-slate-400 text-[11px] font-mono">
                    {new Date(t.created_at).toLocaleString([], {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => openDetails(t)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition font-mono text-[11px] inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Ledger</span>
                    </button>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-500 text-xs">
                  No transactions recorded matching the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Ledger Audit Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#0F1626] border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 text-slate-200 space-y-4">
            <button
              onClick={closeDetails}
              className="absolute right-5 top-5 p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Double-Entry Ledger Audit</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Tx #{selectedTx.id} • {selectedTx.merchant_name}
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#0B0F19] border border-slate-800 rounded-xl space-y-1 font-mono text-xs">
              <div className="text-slate-400">
                Idempotency Key: <span className="text-slate-200">{selectedTx.idempotency_key}</span>
              </div>
              <div className="text-slate-400">
                Timestamp:{' '}
                <span className="text-slate-200">
                  {new Date(selectedTx.created_at).toISOString()}
                </span>
              </div>
            </div>

            {/* Double-Entry Journal Lines */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                General Ledger Journal Entries
              </h4>

              {detailLoading ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  Loading ledger rows...
                </div>
              ) : (
                <div className="space-y-2">
                  {txDetails?.ledger_entries?.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 bg-[#0B0F19] border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono"
                    >
                      <div>
                        <div className="font-bold text-slate-200">{entry.description}</div>
                        <div className="text-[10px] text-slate-500">
                          Account: {entry.account_category}
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-bold ${
                            entry.entry_type === 'CREDIT' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {entry.entry_type}: ₹{entry.amount_inr.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          ({entry.amount_paise} paise)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={closeDetails}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
