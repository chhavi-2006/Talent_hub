import {
  AlertCircle,
  Bus,
  CheckCircle2,
  Coffee,
  Globe,
  Home,
  PenTool,
  Sparkles,
} from 'lucide-react';

const CATEGORY_ICONS = {
  CANTEEN: Coffee,
  STATIONERY: PenTool,
  TRANSPORT: Bus,
  HOSTEL: Home,
  ONLINE: Globe,
};

const CATEGORY_COLORS = {
  CANTEEN: {
    bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    bar: 'from-emerald-500 to-teal-400',
  },
  STATIONERY: {
    bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    bar: 'from-blue-500 to-cyan-400',
  },
  TRANSPORT: {
    bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
    bar: 'from-indigo-500 to-purple-400',
  },
  HOSTEL: {
    bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    bar: 'from-amber-500 to-orange-400',
  },
  ONLINE: {
    bg: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    bar: 'from-purple-500 to-pink-400',
  },
};

export default function CashbackGauge({ limits = [], tier = 'BASIC' }) {
  return (
    <div className="bg-[#0F1626] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">
              Monthly Category Cashback Limits
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              {tier} Multiplier Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time tracking of raw earnings vs monthly caps under campus finance rules
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {limits.map((item) => {
          const Icon = CATEGORY_ICONS[item.category] || Sparkles;
          const colors = CATEGORY_COLORS[item.category] || {
            bg: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
            bar: 'from-emerald-500 to-teal-400',
          };

          const isCapReached = item.remaining_cap_paise <= 0;

          return (
            <div
              key={item.category}
              className="bg-[#0B0F19] border border-slate-800/90 rounded-2xl p-4 space-y-3 hover:border-slate-700 transition"
            >
              {/* Category Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center ${colors.bg}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-100">{item.category}</h3>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Rate:{' '}
                      <strong className="text-emerald-400 font-semibold">
                        {item.effective_rate_pct}%
                      </strong>{' '}
                      <span className="text-[10px] text-slate-500">
                        ({item.base_rate_pct}% base)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-white">
                    ₹{item.used_cashback_inr.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500 block font-mono">
                    of ₹{item.monthly_cap_inr.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Progress Track */}
              <div className="space-y-1">
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className={`h-2 rounded-full bg-gradient-to-r ${colors.bar} transition-all duration-500`}
                    style={{ width: `${Math.min(100, item.percentage_used)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>{item.percentage_used.toFixed(0)}% utilized</span>
                  <span>
                    {isCapReached ? (
                      <span className="text-rose-400 font-semibold">Monthly Cap Reached</span>
                    ) : (
                      <span className="text-emerald-400">
                        ₹{item.remaining_cap_inr.toFixed(2)} remaining
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {limits.length === 0 && (
          <div className="col-span-full py-6 text-center text-xs text-slate-500">
            Loading monthly category limits...
          </div>
        )}
      </div>
    </div>
  );
}
