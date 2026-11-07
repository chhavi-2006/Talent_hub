import { Check, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function TierUpgradeModal({ isOpen, onClose }) {
  const { wallet, user, updateTier } = useAuth();
  const [selectedTier, setSelectedTier] = useState(
    wallet?.tier || user?.wallet_tier || 'BASIC'
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const currentTier = wallet?.tier || user?.wallet_tier || 'BASIC';

  const tiers = [
    {
      id: 'BASIC',
      name: 'Basic Tier',
      rateMult: '1.0×',
      capMult: '1.0×',
      badge: 'bg-slate-700/50 text-slate-300 border-slate-600',
      desc: 'Default campus tier. Standard base cashback rates and basic monthly category caps (e.g. ₹50 Canteen, ₹20 Stationery).',
    },
    {
      id: 'PRIME',
      name: 'Prime Tier',
      rateMult: '1.5×',
      capMult: '1.5×',
      badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      desc: '50% higher cashback rates across all campus merchants + 1.5× higher monthly caps (e.g. ₹75 Canteen, ₹30 Stationery).',
    },
    {
      id: 'PREMIUM',
      name: 'Premium Tier',
      rateMult: '2.0×',
      capMult: '2.0×',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      desc: 'Double cashback rates (2.0×) and double monthly caps (e.g. ₹100 Canteen, ₹40 Stationery, ₹200 Transport).',
    },
  ];

  const handleApply = async () => {
    setLoading(true);
    setMessage('');
    try {
      await updateTier(selectedTier);
      setMessage(`Switched to ${selectedTier} tier successfully!`);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      alert('Could not update tier.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#0F1626] border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 text-slate-200 space-y-5">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Wallet Tier Simulator</h2>
            <p className="text-xs text-slate-400">
              Live testing of cashback rate & monthly cap multipliers
            </p>
          </div>
        </div>

        {message && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl font-medium">
            {message}
          </div>
        )}

        <div className="space-y-3">
          {tiers.map((t) => {
            const isSelected = selectedTier === t.id;
            const isCurrent = currentTier === t.id;

            return (
              <div
                key={t.id}
                onClick={() => setSelectedTier(t.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition ${
                  isSelected
                    ? 'bg-[#141E34] border-emerald-500/80 shadow-lg shadow-emerald-500/10'
                    : 'bg-[#0B0F19] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500 text-slate-950'
                          : 'border-slate-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="font-bold text-sm text-white">{t.name}</span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        Current
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-emerald-400 font-bold">{t.rateMult} Rate</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-indigo-400 font-bold">{t.capMult} Cap</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mt-2 pl-6">{t.desc}</p>
              </div>
            );
          })}
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
            type="button"
            disabled={loading || selectedTier === currentTier}
            onClick={handleApply}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition active:scale-95"
          >
            {loading ? 'Updating...' : `Set ${selectedTier} Tier`}
          </button>
        </div>
      </div>
    </div>
  );
}
