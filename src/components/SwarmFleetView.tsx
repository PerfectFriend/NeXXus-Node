import React, { useState } from 'react';
import { 
  Network, Smartphone, Laptop, Plus, AlertTriangle, ShieldCheck, 
  RefreshCw, PowerOff, Power, CheckCircle2, Flame, Wifi, Clock, ArrowRight,
  ShieldAlert, Activity, QrCode, X, Copy, Check, Cpu, Calendar
} from 'lucide-react';
import { NodeRecord, Bip39Identity, DeviceType, VaultFile } from '../types/nexxus';
import { secureRandomInt } from '../utils/cryptoRandom';
import { GrokSimulationLabModal } from './GrokSimulationLabModal';
import { KademliaEngineModal } from './KademliaEngineModal';
import { NetworkRepairModal } from './NetworkRepairModal';
import { SoakTestDashboardModal } from './SoakTestDashboardModal';
import { SwarmHealthDashboardModal } from './SwarmHealthDashboardModal';

interface SwarmFleetViewProps {
  nodes: NodeRecord[];
  identity: Bip39Identity;
  vaultFiles?: VaultFile[];
  onUpdateFiles?: (files: VaultFile[]) => void;
  onToggleNodeOnline: (nodeId: string) => void;
  onSimulateEmergencyGrace: (nodeId: string) => void;
  onExpireGraceNow: (nodeId: string) => void;
  onAddNewNode: (newNode: Partial<NodeRecord>) => void;
  graceNodeId: string | null;
  graceRemainingSeconds: number | null;
}

export const SwarmFleetView: React.FC<SwarmFleetViewProps> = ({
  nodes,
  identity,
  vaultFiles = [],
  onUpdateFiles,
  onToggleNodeOnline,
  onSimulateEmergencyGrace,
  onExpireGraceNow,
  onAddNewNode,
  graceNodeId,
  graceRemainingSeconds,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSimLabModal, setShowSimLabModal] = useState(false);
  const [showKademliaModal, setShowKademliaModal] = useState(false);
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [showSoakModal, setShowSoakModal] = useState(false);
  const [showSwarmHealthModal, setShowSwarmHealthModal] = useState(false);
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeType, setNewNodeType] = useState<DeviceType>('android');
  const [newNodeStorageGb, setNewNodeStorageGb] = useState<number>(64);
  const [copiedPairing, setCopiedPairing] = useState(false);

  // Total cluster metrics
  const totalFleetStorage = nodes.reduce((sum, n) => sum + (n.isOnline ? n.totalStorageAllocatedGb : 0), 0);
  const totalVaultBonus = nodes.reduce((sum, n) => sum + (n.isOnline ? n.personalVaultQuotaGb : 0), 0);
  const onlineCount = nodes.filter(n => n.isOnline).length;

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCreateNodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeName.trim()) return;

    const reserved16Gb = Math.floor(newNodeStorageGb / 16);
    const totalAllocated = reserved16Gb * 16;
    const personalQuota = totalAllocated / 8;

    const chars = "abcdefghijklmnopqrstuvwxyz234567";
    let randOnion = "nexxus";
    for (let i = 0; i < 48; i++) randOnion += chars[secureRandomInt(chars.length)];

    const randomAsns = [
      { asn: 'AS9009', isp: 'M247 Global Network' },
      { asn: 'AS15169', isp: 'Google Fiber Direct' },
      { asn: 'AS3301', isp: 'Telia Company AB' },
      { asn: 'AS2516', isp: 'KDDI Corporation Japan' },
      { asn: 'AS1273', isp: 'Vodafone Backbone' },
    ];
    const pickedAsn = randomAsns[secureRandomInt(randomAsns.length)];

    onAddNewNode({
      name: newNodeName.trim(),
      deviceType: newNodeType,
      model: newNodeType === 'android' ? 'Android Device (Node)' : 'Desktop Station',
      isOnline: true,
      isCurrentDevice: false,
      onionAddress: `${randOnion.slice(0, 56)}.onion:9050`,
      v2rayActive: true,
      torActive: true,
      smpServerRunning: false,
      xFTPRelayRunning: true,
      batteryLevel: 100,
      isCharging: true,
      temperatureC: 33.5,
      wifiSsid: 'Home_Decentralized_Mesh',
      wifiSignalDbm: -52,
      asn: pickedAsn.asn,
      isp: pickedAsn.isp,
      internalTotalGb: newNodeStorageGb,
      internalFreeGb: newNodeStorageGb - 8,
      autoModeEnabled: true,
      reservedSections16Gb: reserved16Gb,
      totalStorageAllocatedGb: totalAllocated,
      personalVaultQuotaGb: personalQuota,
      personalVaultUsedGb: 0.1,
      reputationScore: 400,
      reputationTier: 'Reliable Node (301-600)',
      consecutiveDaysWithoutPenalty: 0,
      penaltiesCount: 0,
      storedChunksCount: 1200,
      replicatedChunksServed: 400,
      bandwidthSharedMb: 120.0,
      externalDevices: [],
    });

    setNewNodeName('');
    setShowAddModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Cluster Overview Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-400 font-bold uppercase">
                BIP-39 Единый Ключ Владельца
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {identity.masterPublicKey.slice(0, 14)}...
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono mt-1">
              Управление Флотом Нод
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              На одном BIP-39 ключе можно создавать неограниченное число нод из старых телефонов или ПК. 
              Каждая нода отдаёт 7/8 в общую сеть и даёт вам 1/8 персонального криптооблака.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-open-kademlia-engine"
              onClick={() => setShowKademliaModal(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-purple-950/70 hover:bg-purple-900/90 text-purple-200 border border-purple-500/40 text-xs font-bold transition shadow-lg shrink-0 cursor-pointer font-mono"
            >
              <Network className="w-4 h-4 text-purple-400" />
              <span>Kademlia DHT & PoW (WS3)</span>
            </button>

            <button
              id="btn-open-repair-modal"
              onClick={() => setShowRepairModal(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-200 border border-emerald-500/40 text-xs font-bold transition shadow-lg shrink-0 cursor-pointer font-mono"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Ремонт Чанков (WS4 Live)</span>
            </button>

            <button
              id="btn-open-soak-modal"
              onClick={() => setShowSoakModal(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition shadow-lg shrink-0 cursor-pointer font-mono"
            >
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>14-Дней Soak-Тест (WS6)</span>
            </button>

            <button
              id="btn-open-swarm-health-modal"
              onClick={() => setShowSwarmHealthModal(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition shadow-lg shrink-0 cursor-pointer font-mono"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Здоровье & Anti-Outsource</span>
            </button>

            <button
              id="btn-open-grok-sim-lab"
              onClick={() => setShowSimLabModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition shadow-lg shrink-0 cursor-pointer font-mono"
            >
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Монте-Карло Анализ (Grok)</span>
            </button>

            <button
              id="btn-add-new-node-modal"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-lg shadow-cyan-950/50 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Подключить старый телефон / ПК</span>
            </button>
          </div>
        </div>

        {/* Global Cluster Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-400">Всего нод в связке:</span>
            <div className="text-xl font-black text-white font-mono mt-1">
              {onlineCount} <span className="text-sm font-normal text-slate-400">/ {nodes.length} онлайн</span>
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-400">Совокупная сеть (16GB блоки):</span>
            <div className="text-xl font-black text-cyan-400 font-mono mt-1">
              {totalFleetStorage} GB
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-400">Суммарная квота 1/8:</span>
            <div className="text-xl font-black text-purple-400 font-mono mt-1">
              {totalVaultBonus.toFixed(1)} GB
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-400">Штрафов за сбои:</span>
            <div className="text-xl font-black text-amber-400 font-mono mt-1">
              {nodes.reduce((sum, n) => sum + n.penaltiesCount, 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Nodes Cards Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Network className="w-5 h-5 text-emerald-400" />
          Все Устройства в Вашем Пространстве
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {nodes.map(node => {
            const isGraceActive = node.id === graceNodeId && graceRemainingSeconds !== null;

            return (
              <div
                key={node.id}
                className={`p-5 rounded-2xl border transition shadow-lg space-y-4 ${
                  !node.isOnline
                    ? 'bg-red-950/20 border-red-500/40'
                    : node.isCurrentDevice
                    ? 'bg-slate-900 border-emerald-500/40 shadow-emerald-950/20'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                {/* Node Title & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl border ${
                      !node.isOnline
                        ? 'bg-red-950/60 border-red-500/40 text-red-400'
                        : 'bg-slate-950 border-slate-800 text-cyan-400'
                    }`}>
                      {node.deviceType === 'android' ? <Smartphone className="w-6 h-6" /> : <Laptop className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white font-mono">{node.name}</h3>
                        {node.isCurrentDevice && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-semibold">
                            Текущее
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">{node.model}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-mono px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5 ${
                      node.isOnline
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-950 text-red-400 border border-red-500/40 animate-pulse'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${node.isOnline ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      {node.isOnline ? 'ОНЛАЙН' : 'ОФФЛАЙН'}
                    </span>
                  </div>
                </div>

                {/* Grace Period Alert on the node if triggered */}
                {isGraceActive && (
                  <div className="p-3 rounded-xl bg-amber-950/70 border border-amber-500/50 text-xs text-amber-200 space-y-2">
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        АВАРИЙНЫЙ ЛЬГОТНЫЙ ПЕРИОД:
                      </span>
                      <span className="font-mono text-white text-sm bg-black/50 px-2 py-0.5 rounded">
                        {formatCountdown(graceRemainingSeconds)}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-200/90 leading-relaxed">
                      У вас есть 1 час на включение ноды. При истечении таймера нода будет оштрафована (минус к репутации), а её чанки будут перераспределены на топовые ноды.
                    </p>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => onExpireGraceNow(node.id)}
                        className="px-2.5 py-1 rounded bg-red-900/60 hover:bg-red-800 text-[11px] text-red-200 border border-red-500/30 font-semibold transition cursor-pointer"
                      >
                        Сымитировать истечение 1 часа (Штраф + Эвакуация чанков)
                      </button>
                    </div>
                  </div>
                )}

                {/* Storage & 1/8 Quota Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-400">База 16GB (Секреты):</span>
                    <div className="font-bold text-purple-400 font-mono">
                      2.0 GB Неуничтожимый Vault
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Чанки расширения ($NEXX):</span>
                    <div className="font-bold text-emerald-400 font-mono">
                      {node.actualForeignChunksStoredGb || 0} GB ({node.dailyEstimatedNexxEarnings || 0} $NEXX/дн)
                    </div>
                  </div>
                </div>

                {/* Reputation & Streak */}
                <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Рейтинг: <strong className="text-white">{node.reputationScore}</strong></span>
                  </div>
                  <div>
                    <span>Стрик без штрафов: <strong className="text-emerald-400">{node.consecutiveDaysWithoutPenalty}/30 дн.</strong></span>
                  </div>
                </div>

                {/* Action Controls & Emergency Simulation Button */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] font-mono text-slate-500 truncate max-w-[200px]">
                    {node.onionAddress}
                  </div>

                  <div className="flex items-center gap-2">
                    {node.isOnline ? (
                      <button
                        onClick={() => onSimulateEmergencyGrace(node.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black hover:bg-red-950/80 text-red-400 border border-red-800 text-xs font-mono font-semibold transition cursor-pointer"
                        title="Имитировать отключение питания или сбой Wi-Fi"
                      >
                        <PowerOff className="w-3.5 h-3.5 text-amber-500" />
                        <span>Инициировать аварийный отказ</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onToggleNodeOnline(node.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer"
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>Вернуть в сеть</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Node Pairing Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Подключить Новое Устройство</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNodeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Название Ноды / Устройства:</label>
                <input
                  type="text"
                  value={newNodeName}
                  onChange={e => setNewNodeName(e.target.value)}
                  placeholder="например: Старый Xiaomi в коридоре"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500 font-sans"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Тип Устройства:</label>
                  <select
                    value={newNodeType}
                    onChange={e => setNewNodeType(e.target.value as DeviceType)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="android">Android Phone (Старый телефон)</option>
                    <option value="desktop_linux">Linux Desktop / Server</option>
                    <option value="desktop_win">Windows Desktop</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Дисковое пространство:</label>
                  <select
                    value={newNodeStorageGb}
                    onChange={e => setNewNodeStorageGb(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="32">32 GB (2 секции по 16GB)</option>
                    <option value="64">64 GB (4 секции по 16GB)</option>
                    <option value="128">128 GB (8 секций по 16GB)</option>
                    <option value="256">256 GB (16 секций по 16GB)</option>
                  </select>
                </div>
              </div>

              {/* Pairing Token Code */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-300 flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                  BIP-39 Pairing Hash для авторизации ноды:
                </span>
                <div className="font-mono text-[11px] text-cyan-300 break-all p-2 rounded bg-black/40 border border-slate-800">
                  nexxus://pair?key={identity.masterPublicKey.slice(0, 32)}&net=onion
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition"
                >
                  Активировать Ноду
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grok Simulation Lab Modal */}
      <GrokSimulationLabModal
        isOpen={showSimLabModal}
        onClose={() => setShowSimLabModal(false)}
      />

      {/* Kademlia DHT & PoW Modal */}
      <KademliaEngineModal
        isOpen={showKademliaModal}
        onClose={() => setShowKademliaModal(false)}
      />

      {/* Network Repair & Rate-Limiter Modal (Live Engine) */}
      <NetworkRepairModal
        isOpen={showRepairModal}
        onClose={() => setShowRepairModal(false)}
        vaultFiles={vaultFiles}
        nodes={nodes}
        onUpdateFiles={onUpdateFiles}
      />

      {/* 14-Day Soak Test Dashboard Modal */}
      <SoakTestDashboardModal
        isOpen={showSoakModal}
        onClose={() => setShowSoakModal(false)}
      />

      {/* Swarm Health & Anti-Outsourcing Modal */}
      <SwarmHealthDashboardModal
        isOpen={showSwarmHealthModal}
        onClose={() => setShowSwarmHealthModal(false)}
      />
    </div>
  );
};
