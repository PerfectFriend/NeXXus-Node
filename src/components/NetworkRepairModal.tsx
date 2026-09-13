import React, { useState } from 'react';
import { Activity, ShieldCheck, RefreshCw, AlertTriangle, ArrowRight, Gauge, Layers, CheckCircle2, Play } from 'lucide-react';

interface RepairEvent {
  chunkId: string;
  lostReplicaNode: string;
  electedCoordinator: string;
  targetNewNode: string;
  targetAsn: string;
  bytesTransferred: number;
  durationMs: number;
  status: 'SUCCESS' | 'IN_PROGRESS' | 'RATE_LIMITED';
}

export const NetworkRepairModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [dailyQuotaUsedMb, setDailyQuotaUsedMb] = useState(4.2);
  const maxDailyQuotaMb = 12.5;
  const [isSimulatingRepair, setIsSimulatingRepair] = useState(false);
  const [repairLogs, setRepairLogs] = useState<RepairEvent[]>([
    {
      chunkId: 'chunk_7fa8_01 (16 KB)',
      lostReplicaNode: 'tecno_camon_19 (Offline > 1h)',
      electedCoordinator: 'thinkpad_x230_guard (AS15169)',
      targetNewNode: 'samsung_a52_node (AS24940)',
      targetAsn: 'AS24940 (Hetzner)',
      bytesTransferred: 16384,
      durationMs: 420,
      status: 'SUCCESS',
    },
    {
      chunkId: 'chunk_3c9d_04 (16 KB)',
      lostReplicaNode: 'redmi_note_10 (Battery dead)',
      electedCoordinator: 'pixel_6a_donor (AS13335)',
      targetNewNode: 'xiaomi_pad_5 (AS32934)',
      targetAsn: 'AS32934 (Cloudflare)',
      bytesTransferred: 16384,
      durationMs: 510,
      status: 'SUCCESS',
    },
  ]);

  if (!isOpen) return null;

  const handleTriggerRepair = () => {
    setIsSimulatingRepair(true);
    setTimeout(() => {
      const newMb = Math.min(maxDailyQuotaMb, +(dailyQuotaUsedMb + 0.15).toFixed(2));
      setDailyQuotaUsedMb(newMb);

      const isLimited = newMb >= maxDailyQuotaMb;
      const newEvent: RepairEvent = {
        chunkId: `chunk_${Math.random().toString(16).slice(2, 6)}_0${Math.floor(Math.random() * 5 + 1)} (16 KB)`,
        lostReplicaNode: `donor_node_${Math.floor(Math.random() * 80 + 1)} (Unresponsive)`,
        electedCoordinator: `coordinator_${Math.floor(Math.random() * 20 + 1)}`,
        targetNewNode: `fresh_node_${Math.floor(Math.random() * 30 + 1)}`,
        targetAsn: `AS${Math.floor(Math.random() * 50000 + 1000)} (Diverse AS)`,
        bytesTransferred: 16384,
        durationMs: Math.floor(Math.random() * 300 + 350),
        status: isLimited ? 'RATE_LIMITED' : 'SUCCESS',
      };

      setRepairLogs(prev => [newEvent, ...prev.slice(0, 4)]);
      setIsSimulatingRepair(false);
    }, 900);
  };

  const quotaPercent = Math.min(100, Math.round((dailyQuotaUsedMb / maxDailyQuotaMb) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-500/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Сетевой Ремонт Чанков & Rate-Limiter (WS4)
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Авто-регенерация RF=6× реплика-сета и защита трафика донора (12.5 МБ/сутки)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm font-mono px-2 py-1 rounded bg-slate-800"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto space-y-4 pr-1 text-xs">
          {/* Rate-limiter budget gauge */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white">Суточный лимит трафика ремонта (Rate-Limiter):</span>
              </div>
              <span className="font-mono text-xs font-bold text-cyan-300">
                {dailyQuotaUsedMb} / {maxDailyQuotaMb} МБ ({quotaPercent}%)
              </span>
            </div>

            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  quotaPercent > 80 ? 'bg-amber-500' : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                }`}
                style={{ width: `${quotaPercent}%` }}
              />
            </div>

            <p className="text-slate-400 text-[11px] leading-relaxed">
              🛡️ Модель ограничений: Мобильная нода никогда не сожжёт сотовый трафик владельца. При превышении 12.5 МБ/сутки ремонтные трансферы приостанавливаются до следующего UTC-дня или подключения к Wi-Fi.
            </p>
          </div>

          {/* Trigger manual emergency simulation */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
            <div>
              <div className="font-bold text-white">Эмуляция выпадения реплики и сетевого ремонта</div>
              <div className="text-[11px] text-slate-400">Survival кворум выбирает нового пира и восстанавливает RF=6</div>
            </div>

            <button
              disabled={isSimulatingRepair || dailyQuotaUsedMb >= maxDailyQuotaMb}
              onClick={handleTriggerRepair}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-mono text-xs font-bold transition cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSimulatingRepair ? 'animate-spin' : ''}`} />
              <span>{isSimulatingRepair ? 'Восстановление...' : 'Симулировать ремонт'}</span>
            </button>
          </div>

          {/* Repair Events Stream */}
          <div className="space-y-2">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Журнал сетевых ремонтов (Network-Driven Repair Relay):</span>
            </div>

            <div className="space-y-2">
              {repairLogs.map((log, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{log.chunkId}</span>
                    <span className={`text-[10px] px-2 py-0.2 rounded font-bold ${
                      log.status === 'SUCCESS' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-red-950 text-red-300'
                    }`}>
                      {log.status === 'SUCCESS' ? 'RF=6 ВОССТАНОВЛЕН' : 'RATE-LIMITED'}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                    <span className="text-red-400 line-through">{log.lostReplicaNode}</span>
                    <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                    <span className="text-cyan-300">{log.electedCoordinator}</span>
                    <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                    <span className="text-emerald-300 font-bold">{log.targetNewNode}</span>
                  </div>

                  <div className="text-[10px] text-slate-500 flex items-center justify-between pt-0.5">
                    <span>Размещение: {log.targetAsn}</span>
                    <span>{log.durationMs} ms • {log.bytesTransferred} bytes</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 font-mono flex items-center justify-between shrink-0">
          <span>* Ветка WS4: Replica-set, network-driven repair, rate-limit</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
