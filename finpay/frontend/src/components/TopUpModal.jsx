import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  Plus,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { useState } from 'react';
import client from '../api/client.js';

export default function TopUpModal({ isOpen, onClose, onTopUpSuccess }) {
  const [amountInr, setAmountInr] = useState('500');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const quickAmounts = [100, 250, 500, 1000, 2000];

  const handleTopUp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const amountPaise = Math.round(parseFloat(amountInr || '0') * 100);
    const key = `TOPUP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    try {
      const res = await client.post('/wallet/topup', {
        amount_paise: amountPaise,
        idempotency_key: key,
      });

      setSuccess(true);
      if (onTopUpSuccess) {
        onTopUpSuccess(res.data);
      }
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Top-up request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#0F1626] border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 text-slate-200">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Wallet Loaded Successfully!</h3>
            <p className="text-xs text-slate-400">
              Funds are instantly available for on-campus merchant payments.
            </p>
          </div>
        ) : (
          <form onSubmit={handleTopUp} className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Load Digital Wallet</h2>
                <p className="text-xs text-slate-400">Instant Campus Gateway • Zero Fees</p>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Select Quick Amount
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmountInr(amt.toString())}
                    className={`py-2 rounded-xl text-xs font-mono font-bold border transition ${
                      amountInr === amt.toString()
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                        : 'bg-[#0B0F19] border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1">
                Custom Amount (₹ INR)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-500 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  step="10"
                  min="10"
                  max="10000"
                  value={amountInr}
                  onChange={(e) => setAmountInr(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Campus policy: 0% convenience fee applied to student wallet top-ups.</span>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition flex items-center gap-2"
              >
                {loading ? 'Processing...' : 'Load Funds'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
