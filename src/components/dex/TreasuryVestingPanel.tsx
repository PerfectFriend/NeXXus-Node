import React from 'react';
import { Lock, Clock, CheckCircle2 } from 'lucide-react';
import { Bip39Identity } from '../../types/nexxus';

interface TreasuryVestingPanelProps {
  identity: Bip39Identity;
}

export const TreasuryVestingPanel: React.FC<TreasuryVestingPanelProps> = ({ identity }) => {
  const batches = identity.vestingBatches ?? [];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            График 8-Недельного Вестинга (Anti-Churn Lock)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Токены созревают 56 дней. Это гарантирует, что нода остаётся в сети 24/7 без штрафов.
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2.5 py-1 rounded-lg">
          {(identity.lockedNexx8Weeks ?? 0).toFixed(1)} $NEXX в заморозке
        </span>
      </div>

      {/* List of Vesting Batches */}
      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
        {batches.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500 font-mono">
            Нет активных траншей вестинга. Выделите хранилище под чужие чанки для получения суточных наград!
          </div>
        ) : (
          batches.map(batch => (
            <div
              key={batch.id}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white font-mono">+{(batch.amount ?? 0).toFixed(1)} $NEXX</span>
                  <span className={`text-[10px] font-mono px-2 py-0.2 rounded font-bold uppercase ${
                    batch.status === 'unlocked' 
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' 
                      : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                  }`}>
                    {batch.status === 'unlocked' ? 'Разблокировано' : `Лок: ${batch.daysRemaining} дн.`}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Источник: <strong className="text-slate-300">{batch.sourceNodeName}</strong> ({batch.foreignChunksGb} GB чанков)
                </div>
              </div>

              <div className="text-right font-mono text-[11px]">
                {batch.status === 'unlocked' ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1 justify-end">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Доступно к выводу
                  </span>
                ) : (
                  <span className="text-slate-400 flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3 text-amber-400" /> созреет через {batch.daysRemaining} дней
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
