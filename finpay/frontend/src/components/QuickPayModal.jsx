import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Copy,
  CreditCard,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import client from '../api/client.js';

export default function QuickPayModal({ isOpen, onClose, wallet, onPaymentSuccess }) {
  const [merchants, setMerchants] = useState([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState('');
  const [amountInr, setAmountInr] = useState('100');
  const [note, setNote] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);

  const generateNewKey = () => {
    const key = `IDEMP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    setIdempotencyKey(key);
  };

  useEffect(() => {
    if (isOpen) {
      loadMerchants();
      generateNewKey();
      setError('');
      setReceipt(null);
    }
  }, [isOpen]);

  const loadMerchants = async () => {
    try {
      const res = await client.get('/merchants');
      setMerchants(res.data);
      if (res.data.length > 0 && !selectedMerchantId) {
        setSelectedMerchantId(res.data[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load merchants:', err);
    }
  };

  if (!isOpen) return null;

  const selectedMerchant = merchants.find(
    (m) => m.id === parseInt(selectedMerchantId, 10)
  );

  const amountPaise = Math.round(parseFloat(amountInr || '0') * 100);

  // Live calculation preview
  const tier = wallet?.tier || 'BASIC';
  const tierRateMult = tier === 'PREMIUM' ? 2.0 : tier === 'PRIME' ? 1.5 : 1.0;

  const baseRate =
    selectedMerchant?.category === 'CANTEEN'
      ? 2.0
      : selectedMerchant?.category === 'STATIONERY'
        ? 1.0
        : selectedMerchant?.category === 'TRANSPORT'
          ? 3.0
          : selectedMerchant?.category === 'HOSTEL'
            ? 0.5
            : selectedMerchant?.category === 'ONLINE'
              ? 1.0
              : 0.0;

  const effectiveRate = baseRate * tierRateMult;
  const rawCashbackPaise = Math.floor((amountPaise * effectiveRate) / 100);

  // Check remaining category cap from wallet limits summary
  const catLimit = wallet?.limits_summary?.find(
    (l) => l.category === selectedMerchant?.category
  );
  const remainingCapPaise = catLimit?.remaining_cap_paise ?? 5000;
  const actualCashbackPaise = Math.min(rawCashbackPaise, remainingCapPaise);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await client.post('/payments/pay', {
        merchant_id: parseInt(selectedMerchantId, 10),
        amount_paise: amountPaise,
        idempotency_key: idempotencyKey,
        note: note.trim(),
      });

      setReceipt(res.data);
      if (onPaymentSuccess) {
        onPaymentSuccess(res.data);
      }
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          'Payment processing failed. Please verify balance and merchant details.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#0F1626] border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 text-slate-200">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {receipt ? (
          // Success Receipt
          <div className="space-y-5 text-center py-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Payment Authorized
              </span>
              <h2 className="text-xl font-bold text-white mt-1">Transaction Successful</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Paid to <strong>{receipt.merchant_name}</strong>
              </p>
            </div>

            <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl p-4 text-xs space-y-2.5 text-left font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Debited Amount:</span>
                <span className="text-white font-bold">₹{receipt.amount_inr.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cashback Credited:</span>
                <span className="text-emerald-400 font-bold">
                  +₹{receipt.actual_cashback_inr.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2">
                <span className="text-slate-400">Net Expense:</span>
                <span className="text-slate-100 font-bold">
                  ₹{receipt.net_debited_inr.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">New Wallet Balance:</span>
                <span className="text-indigo-400 font-bold">
                  ₹{receipt.new_balance_inr.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2 text-[10px] text-slate-500">
                <span>Idempotency Key:</span>
                <span className="truncate max-w-[200px]">{receipt.idempotency_key}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition"
            >
              Done & Return to Wallet
            </button>
          </div>
        ) : (
          // Payment Form
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Quick Pay Merchant</h2>
                  <p className="text-xs text-slate-400">Campus Digital POS Settlement</p>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Merchant Dropdown */}
            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1">
                Select Campus Merchant
              </label>
              <select
                value={selectedMerchantId}
                onChange={(e) => setSelectedMerchantId(e.target.value)}
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition"
                required
              >
                {merchants.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.business_name} • {m.category} ({m.location})
                  </option>
                ))}
              </select>
            </div>

            {/* Amount (₹) */}
            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1">
                Payment Amount (₹ INR)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-500 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={amountInr}
                  onChange={(e) => setAmountInr(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500 transition"
                  required
                />
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-1">
                {amountPaise.toLocaleString('en-IN')} integer paise
              </div>
            </div>

            {/* Live Calculation Preview Card */}
            <div className="bg-[#0B0F19] border border-slate-800/90 rounded-2xl p-4 text-xs space-y-2 font-mono">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider pb-1 border-b border-slate-800/80 flex items-center justify-between">
                <span>Cashback Preview</span>
                <span className="text-emerald-400 font-bold">{tier} Tier</span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Base Rate:</span>
                <span>{baseRate}%</span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Tier Multiplier:</span>
                <span>{tierRateMult.toFixed(1)}× ({effectiveRate}% effective)</span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Raw Cashback:</span>
                <span className="text-slate-200">
                  ₹{(rawCashbackPaise / 100).toFixed(2)} ({rawCashbackPaise} paise)
                </span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Remaining Category Cap:</span>
                <span>₹{(remainingCapPaise / 100).toFixed(2)}</span>
              </div>

              <div className="flex justify-between border-t border-slate-800 pt-2 font-bold">
                <span className="text-emerald-400">Instant Cashback Credited:</span>
                <span className="text-emerald-400">
                  +₹{(actualCashbackPaise / 100).toFixed(2)} ({actualCashbackPaise} p)
                </span>
              </div>
            </div>

            {/* Idempotency Key Section */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                  Payment Safety (Idempotency Key)
                </label>
                <button
                  type="button"
                  onClick={generateNewKey}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono"
                >
                  <RefreshCw className="w-3 h-3" /> Regenerate
                </button>
              </div>
              <input
                type="text"
                value={idempotencyKey}
                onChange={(e) => setIdempotencyKey(e.target.value)}
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-emerald-500"
                required
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Guarantees zero duplicate billing if connection drops or button is clicked twice.
              </p>
            </div>

            {/* Note */}
            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1">
                Transaction Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Lunch with project group"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition active:scale-95 flex items-center gap-2"
              >
                {loading ? 'Processing...' : 'Authorize Payment'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
