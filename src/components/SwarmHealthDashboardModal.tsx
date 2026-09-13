import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Cpu, Activity, Globe, RefreshCw, AlertTriangle, CheckCircle2, Zap, HardDrive, ArrowRight } from 'lucide-react';
import {
  calculateAsnHhi,
  auditChunkReplicas,
  triggerSelfHealing,
  LOCAL_IO_CUTOFF_MS,
  type ChunkHealthAssessment,
  type SelfHealingRepairAction
} from '../utils/antiOutsourcing';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SwarmHealthDashboardModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'asn' | 'healing'>('audit');
  const [simulatedOutsourcing, setSimulatedOutsourcing] = useState(false);
  const [offlineShardIndices, setOfflineShardIndices] = useState<number[]>([]);
  const [repairAction, setRepairAction] = useState<SelfHealingRepairAction | null>(null);
  const [isHealingInProgress, setIsHealingInProgress] = useState(false);

  // 6 Distributed Shards across independent Autonomous Systems (ASNs)
  const defaultReplicas = [
    { shardIndex: 0, nodeId: 'node-helsinki-1', nodeName: 'Alpha (Helsinki)', asn: 'AS13335', ispName: 'Cloudflare Edge', isOnline: !offlineShardIndices.includes(0), measuredLatencyMs: 24 },
    { shardIndex: 1, nodeId: 'node-frankfurt-2', nodeName: 'Beta (Frankfurt)', asn: 'AS24940', ispName: 'Hetzner Sovereign', isOnline: !offlineShardIndices.includes(1), measuredLatencyMs: 38 },
    { shardIndex: 2, nodeId: 'node-warsaw-3', nodeName: 'Gamma (Warsaw)', asn: 'AS16276', ispName: 'OVHcloud Relay', isOnline: !offlineShardIndices.includes(2), measuredLatencyMs: 42 },
    { shardIndex: 3, nodeId: 'node-zurich-4', nodeName: 'Delta (Zurich)', asn: 'AS31898', ispName: 'Oracle Cloud Direct', isOnline: !offlineShardIndices.includes(3), measuredLatencyMs: 51 },
    {
      shardIndex: 4,
      nodeId: 'node-canary-5',
      nodeName: 'Canary Trap P1 (Reykjavik)',
      asn: 'AS9009',
      ispName: 'M247 Autonomous',
      isOnline: !offlineShardIndices.includes(4),
      // If simulated outsourcing is turned ON, latency spikes to 320ms (violating 120ms limit)
      measuredLatencyMs: simulatedOutsourcing ? 342 : 46,
      forceCanaryFail: simulatedOutsourcing,
    },
    { shardIndex: 5, nodeId: 'node-singapore-6', nodeName: 'Parity P2 (Singapore)', asn: 'AS15169', ispName: 'Google Fiber Peer', isOnline: !offlineShardIndices.includes(5), measuredLatencyMs: 78 },
  ];

  const assessment: ChunkHealthAssessment = auditChunkReplicas(
    0,
    '7f8e9a2b3c4d5e6f0123456789abcdef0123456789abcdef0123456789abcdef',
    defaultReplicas
  );

  const candidateBackups = [
    { nodeId: 'node-backup-tokyo', nodeName: 'Backup Omega (Tokyo)', asn: 'AS2516' },
    { nodeId: 'node-backup-stockholm', nodeName: 'Backup Sigma (Stockholm)', asn: 'AS3301' },
    { nodeId: 'node-backup-vancouver', nodeName: 'Backup Zeta (Vancouver)', asn: 'AS852' },
  ];

  const handleRunSelfHealing = () => {
    setIsHealingInProgress(true);
    setTimeout(() => {
      try {
        const action = triggerSelfHealing(assessment, candidateBackups);
        setRepairAction(action);
        // Reset simulated errors after successful heal
        setOfflineShardIndices([]);
        setSimulatedOutsourcing(false);
      } catch (e) {
        console.error(e);
      } finally {
        setIsHealingInProgress(false);
      }
    }, 600);
  };

  const toggleShardOffline = (idx: number) => {
    setOfflineShardIndices(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
    setRepairAction(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Мониторинг Сворма & Anti-Outsourcing Proofs
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Защита от аутсорсинга в S3 • Индекс децентрализации ASN • Авто-регенерация кворума
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-mono shrink-0">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeTab === 'audit' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            Anti-Outsourcing & Шарды
          </button>
          <button
            onClick={() => setActiveTab('asn')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeTab === 'asn' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            Индекс ASN (HHI: {assessment.hhiIndex})
          </button>
          <button
            onClick={() => setActiveTab('healing')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeTab === 'healing' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            Петля Самоисцеления (Self-Healing)
          </button>
        </div>

        {/* Tab 1: Anti-Outsourcing Audit */}
        {activeTab === 'audit' && (
          <div className="overflow-y-auto space-y-4 pr-1 text-xs">
            {/* Simulation controls */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-white block">Симуляция Атаки Облачного Посредничества (Outsourcing Attack):</span>
                <span className="text-[11px] text-slate-400">
                  Нода пытается пересылать запросы в AWS S3 вместо хранения на локальном диске.
                </span>
              </div>
              <button
                onClick={() => setSimulatedOutsourcing(!simulatedOutsourcing)}
                className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold transition border cursor-pointer shrink-0 ${
                  simulatedOutsourcing
                    ? 'bg-red-950 text-red-300 border-red-500/50'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                {simulatedOutsourcing ? '⚠️ Атака Активирована (+300ms)' : '▶ Включить Аутсорсинг'}
              </button>
            </div>

            {/* Shard list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono">
              {assessment.replicas.map(shard => {
                const isFailed = !shard.isOnline || shard.isOutsourcedSuspect;
                return (
                  <div
                    key={shard.shardIndex}
                    onClick={() => toggleShardOffline(shard.shardIndex)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer ${
                      !isFailed
                        ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        : 'bg-red-950/20 border-red-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-cyan-300">
                        Шард #{shard.shardIndex} ({shard.shardIndex >= 4 ? 'Четность' : 'Данные'})
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        !isFailed ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-red-950 text-red-300 border border-red-500/30'
                      }`}>
                        {!isFailed ? 'Локальный Диск' : shard.isOutsourcedSuspect ? 'Аутсорсинг (Задержка)' : 'Офлайн'}
                      </span>
                    </div>

                    <div className="text-white font-semibold text-xs">{shard.nodeName}</div>
                    <div className="text-slate-400 text-[11px] flex items-center justify-between mt-1">
                      <span>{shard.asn} ({shard.ispName})</span>
                      <span className={shard.latencyMs > LOCAL_IO_CUTOFF_MS ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                        {shard.isOnline ? `${shard.latencyMs} мс` : 'ERR'}
                      </span>
                    </div>

                    {shard.isCanaryTrap && (
                      <div className="mt-2 text-[10px] bg-amber-950/40 border border-amber-500/30 text-amber-300 px-2 py-1 rounded">
                        Канареечная ловушка (Canary Trap): отсечка {LOCAL_IO_CUTOFF_MS} мс
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white">Кворум Чанка:</span>
                <span className={`font-mono font-bold ${assessment.isQuorumHealthy ? 'text-emerald-400' : 'text-red-400'}`}>
                  {assessment.aliveReplicas} / 6 валидных копий (Минимум: {assessment.requiredQuorum})
                </span>
              </div>
              {assessment.needsSelfHealing && (
                <button
                  onClick={handleRunSelfHealing}
                  disabled={isHealingInProgress}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isHealingInProgress ? 'animate-spin' : ''}`} />
                  <span>Запустить Самовосстановление</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: ASN HHI Index */}
        {activeTab === 'asn' && (
          <div className="overflow-y-auto space-y-4 pr-1 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">Индекс Херфиндаля-Хиршмана (ASN HHI):</span>
                <span className={`px-2.5 py-0.5 rounded font-mono font-bold text-xs ${
                  assessment.hhiRating === 'EXCELLENT' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                }`}>
                  {assessment.hhiIndex} ({assessment.hhiRating === 'EXCELLENT' ? 'Высокая Децентрализация' : 'Концентрация'})
                </span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Математический показатель концентрации реплик по автономным системам провайдеров (ASN). Значение &lt; 2500 гарантирует, что падение или блокировка любого крупного дата-центра (Cloudflare, Hetzner, OVH) не уничтожит кворум 4+2.
              </p>

              <div className="space-y-2 pt-2">
                <span className="text-slate-300 font-bold block">Распределение по ASN:</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                  {Object.entries(calculateAsnHhi(defaultReplicas.map(r => r.asn)).asnDistribution).map(([asn, pct]) => (
                    <div key={asn} className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <span className="text-cyan-400">{asn}</span>
                      <span className="text-white font-bold">{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Self-Healing Loop */}
        {activeTab === 'healing' && (
          <div className="overflow-y-auto space-y-4 pr-1 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="font-bold text-white text-sm block">Журнал Автономного Самоисцеления (Self-Healing Daemon):</span>
              <p className="text-slate-400 text-[11px]">
                При потере шардов или обнаружении поддельного ответа демон автоматически обращается к оставшимся здоровым шардам, решает систему уравнений Reed-Solomon в GF(2^8) и реплицирует шард на новый узел с другим ASN.
              </p>

              {repairAction ? (
                <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 space-y-2 font-mono text-[11px]">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Успешный сеанс исцеления {repairAction.actionId} ({repairAction.durationMs} мс)</span>
                  </div>
                  <div className="text-slate-300 space-y-1">
                    <div>• Восстановлено из кворума шардов: #{repairAction.recoveredFromIndices.join(', #')}</div>
                    <div>• Потерянные шарды: #{repairAction.lostShardIndices.join(', #')}</div>
                    <div>• Новые целевые ноды репликации: {repairAction.targetNewNodes.map(n => `${n.nodeName} (${n.asn})`).join(', ')}</div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-lg bg-slate-900 border border-slate-850 text-center text-slate-500 font-mono">
                  Все чанки находятся в здоровом состоянии. Отключите узел на первой вкладке, чтобы спровоцировать авто-восстановление.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 font-mono flex items-center justify-between shrink-0">
          <span>* NeXXUs Anti-Outsourcing Engine v2.0 (ASNs & Latency Cutoff 120ms)</span>
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
