import {
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Plus,
  QrCode,
  Receipt,
  RefreshCw,
  Sparkles,
  Store,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import client from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function MerchantTerminal() {
  const { user } = useAuth();
  const [billAmountInr, setBillAmountInr] = useState('150');
  const [customerNote, setCustomerNote] = useState('');
  const [generatedBill, setGeneratedBill] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [merchantProfile, setMerchantProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadData = async () => {
    try {
      const [mRes, txRes] = await Promise.all([
        client.get('/merchants'),
        client.get('/payments/history?limit=50'),
      ]);
      const myMerchant = mRes.data.find((m) => m.id === user.merchant_id) || mRes.data[0];
      setMerchantProfile(myMerchant);
      setTransactions(txRes.data);
    } catch (err) {
      console.error('Failed to load merchant workspace:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBill = async (e) => {
    e.preventDefault();
    setLoading(true);
    const amountPaise = Math.round(parseFloat(billAmountInr || '0') * 100);

    try {
      const res = await client.post('/merchants/pos/create-bill', {
        amount_paise: amountPaise,
        order_notes: customerNote,
      });
      setGeneratedBill(res.data);
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to generate POS bill.');
    } finally {
      setLoading(false);
    }
  };

  const copyKey = () => {
    if (generatedBill) {
      navigator.clipboard.writeText(generatedBill.suggested_idempotency_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const balanceInr = merchantProfile ? merchantProfile.wallet_balance_inr.toFixed(2) : '0.00';

  return (
    <div className="space-y-6 pb-16">
      {/* Merchant Header */}
      <div className="bg-[#0F1626] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">
                  {merchantProfile?.business_name || user?.name}
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Verified Campus POS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Category: <strong>{merchantProfile?.category}</strong> • Location:{' '}
                {merchantProfile?.location}
              </p>
            </div>
          </div>
        </div>

        {/* Settlement Wallet Tile */}
        <div className="px-5 py-3 rounded-2xl bg-[#0B0F19] border border-slate-800 text-right">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
            Merchant Settlement Balance
          </span>
          <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
            ₹{balanceInr}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: POS Bill Generator Form */}
        <div className="lg:col-span-1 bg-[#0F1626] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">POS Bill Terminal</h2>
          </div>

          <form onSubmit={handleCreateBill} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold uppercase tracking-wider mb-1">
                Bill Charge Amount (₹ INR)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-500 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={billAmountInr}
                  onChange={(e) => setBillAmountInr(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl pl-8 pr-3.5 py-2.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold uppercase tracking-wider mb-1">
                Order Memo / Item Details
              </label>
              <input
                type="text"
                placeholder="e.g. 2x Masala Dosa + Filter Coffee"
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition active:scale-95"
            >
              {loading ? 'Generating...' : 'Generate Student QR Bill'}
            </button>
          </form>

          {/* Generated Bill Card */}
          {generatedBill && (
            <div className="bg-[#0B0F19] border border-emerald-500/40 rounded-2xl p-4 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-emerald-400">{generatedBill.bill_id}</span>
                <span className="text-white font-bold text-base">
                  ₹{generatedBill.amount_inr.toFixed(2)}
                </span>
              </div>

              {/* QR Code Placeholder Box */}
              <div className="w-36 h-36 mx-auto bg-white p-2 rounded-xl flex items-center justify-center">
                <QrCode className="w-full h-full text-slate-950" />
              </div>
              <p className="text-center text-[10px] text-slate-400">
                Student scans via FinPay Quick Pay
              </p>

              <div className="pt-2 border-t border-slate-800 text-[10px] space-y-1">
                <div className="text-slate-400">Idempotency Key:</div>
                <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg text-slate-300">
                  <span className="truncate max-w-[200px]">
                    {generatedBill.suggested_idempotency_key}
                  </span>
                  <button onClick={copyKey} className="text-emerald-400 hover:text-emerald-300">
                    {copied ? 'Copied!' : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Real-time Settlements Received */}
        <div className="lg:col-span-2 bg-[#0F1626] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" /> Incoming Student Settlements (
              {transactions.length})
            </h2>
            <button
              onClick={loadData}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#0B0F19] text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800">
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Settled Amount</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-[#0F1626]">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                      #{tx.id}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {tx.description || 'Customer purchase'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      +₹{tx.amount_inr.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {new Date(tx.created_at).toLocaleString([], {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500 text-xs">
                      No customer payments received yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
