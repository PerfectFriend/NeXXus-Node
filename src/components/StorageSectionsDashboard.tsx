import React, { useState } from 'react';
import { 
  ArrowLeft, HardDrive, Cpu, DollarSign, Layers, ShieldCheck, 
  AlertCircle, CheckCircle2, Smartphone, Server, Laptop, Info,
  TrendingUp, Sparkles, Sliders, RefreshCw, X, Minus, Plus
} from 'lucide-react';
import { NodeRecord, Bip39Identity } from '../types/nexxus';

interface StorageSectionsDashboardProps {
  nodes: NodeRecord[];
  onUpdateNodes: (updatedNodes: NodeRecord[]) => void;
  identity: Bip39Identity;
  onNavigateBackToChat: () => void;
}

export const StorageSectionsDashboard: React.FC<StorageSectionsDashboardProps> = ({
  nodes,
  onUpdateNodes,
  identity,
  onNavigateBackToChat,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'allocation' | 'devices' | 'por_audit'>('allocation');

  // Calculate aggregated stats across all nodes
  const totalAllocatedGb = nodes.reduce((sum, n) => sum + (n.isOnline ? n.totalStorageAllocatedGb : 0), 0);
  const totalSectionsCount = Math.floor(totalAllocatedGb / 16); // 16GB per section

  // User setting: how many sections allocated to personal vault
  const [personalSections, setPersonalSections] = useState<number>(() => {
    const saved = localStorage.getItem('nexxus_personal_sections');
    return saved ? Math.min(totalSectionsCount, Math.max(1, parseInt(saved, 10))) : Math.max(2, Math.floor(totalSectionsCount * 0.25));
  });

  const [selectedSectionDetail, setSelectedSectionDetail] = useState<number | null>(null);

  // Math allocations
  const personalVaultGb = personalSections * 16;
  const miningSections = Math.max(0, totalSectionsCount - personalSections);
  const miningTotalAllocatedGb = miningSections * 16;

  // Actual foreign chunks stored (paid by network)
  // Network fills ~65-75% based on actual swarm storage demand
  const actualForeignOccupancyRatio = 0.68;
  const miningActuallyUsedGb = Number((miningTotalAllocatedGb * actualForeignOccupancyRatio).toFixed(1));
  const miningEmptySpaceGb = Number((miningTotalAllocatedGb - miningActuallyUsedGb).toFixed(1));

  // Rate: 1.25 NEXX per GB/day ONLY for actually stored chunks
  const dailyEarningsNexx = Number((miningActuallyUsedGb * 1.25).toFixed(2));
  const monthlyEarningsNexx = Number((dailyEarningsNexx * 30).toFixed(1));

  const handlePersonalSectionsChange = (newCount: number) => {
    const clamped = Math.max(1, Math.min(totalSectionsCount - 1, newCount));
    setPersonalSections(clamped);
    localStorage.setItem('nexxus_personal_sections', clamped.toString());

    // Sync vault quota back to primary nodes
    const quotaPerNode = (clamped * 16) / Math.max(1, nodes.length);
    const updated = nodes.map(n => ({
      ...n,
      personalVaultQuotaGb: Number(quotaPerNode.toFixed(1)),
    }));
    onUpdateNodes(updated);
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'desktop_linux':
        return <Server className="w-4 h-4 text-orange-400" />;
      case 'desktop_win':
        return <Laptop className="w-4 h-4 text-blue-400" />;
      case 'android':
      default:
        return <Smartphone className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0b0f17] text-slate-100 overflow-hidden h-full">
      {/* 1. Top Fixed Navigation Bar (shrink-0) */}
      <div className="bg-slate-900/95 border-b border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onNavigateBackToChat}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-xs font-semibold shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Назад в Чат</span>
            <span className="sm:hidden">Чат</span>
          </button>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-base font-bold text-white font-mono flex items-center gap-1.5 truncate">
              <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">Дашборд Секций и Майнинга</span>
            </h1>
            <p className="text-[10px] text-slate-400 hidden sm:block truncate">
              Плата только за занятые чужие чанки • Пустое место не оплачивается
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] sm:text-xs shrink-0">
          <button
            onClick={() => setActiveSubTab('allocation')}
            className={`px-2.5 sm:px-3 py-1 rounded-lg font-medium transition ${
              activeSubTab === 'allocation'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Секции
          </button>
          <button
            onClick={() => setActiveSubTab('devices')}
            className={`px-2.5 sm:px-3 py-1 rounded-lg font-medium transition ${
              activeSubTab === 'devices'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Устройства ({nodes.filter(n => n.isOnline).length})
          </button>
          <button
            onClick={() => setActiveSubTab('por_audit')}
            className={`px-2.5 sm:px-3 py-1 rounded-lg font-medium transition ${
              activeSubTab === 'por_audit'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            PoR Аудит
          </button>
        </div>
      </div>

      {/* 2. SUBTAB 1: ALLOCATION & SECTIONS */}
      {activeSubTab === 'allocation' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Top Fixed Controls & Summary (shrink-0, fits within 1 screen without scrolling) */}
          <div className="p-2.5 sm:p-4 bg-slate-950/80 border-b border-slate-800 space-y-2 sm:space-y-3 shrink-0">
            {/* 4 Compact Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs font-mono">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 sm:p-3">
                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>ВСЕГО СЕТИ</span>
                  <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div className="text-sm sm:text-base font-black text-white mt-0.5">
                  {totalSectionsCount} секц. <span className="text-[11px] font-normal text-slate-400">({totalAllocatedGb}G)</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-2 sm:p-3 bg-gradient-to-br from-indigo-950/30 to-slate-900">
                <div className="text-[10px] text-indigo-300 flex items-center justify-between">
                  <span>ЛИЧНЫЙ СЕЙФ</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div className="text-sm sm:text-base font-black text-white mt-0.5">
                  {personalSections} секц. <span className="text-[11px] font-normal text-indigo-300">({personalVaultGb}G)</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-2 sm:p-3 bg-gradient-to-br from-emerald-950/30 to-slate-900">
                <div className="text-[10px] text-emerald-300 flex items-center justify-between">
                  <span>В МАЙНИНГ</span>
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-sm sm:text-base font-black text-white mt-0.5">
                  {miningSections} секц. <span className="text-[11px] font-normal text-emerald-300">({miningActuallyUsedGb}G)</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-2 sm:p-3 bg-gradient-to-br from-amber-950/30 to-slate-900">
                <div className="text-[10px] text-amber-300 flex items-center justify-between">
                  <span>ДОХОД / ДЕНЬ</span>
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-sm sm:text-base font-black text-amber-300 mt-0.5">
                  +{dailyEarningsNexx} <span className="text-[10px] font-normal text-slate-400">NEXX</span>
                </div>
              </div>
            </div>

            {/* Compact Slider Control */}
            <div className="p-2 sm:p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="text-indigo-400 font-bold">Сейф: {personalSections} секций ({personalVaultGb} ГБ)</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-emerald-400 font-bold">Майнинг: {miningSections} секций ({miningTotalAllocatedGb} ГБ)</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePersonalSectionsChange(personalSections - 1)}
                    disabled={personalSections <= 1}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handlePersonalSectionsChange(personalSections + 1)}
                    disabled={personalSections >= totalSectionsCount - 1}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <input
                type="range"
                min={1}
                max={Math.max(2, totalSectionsCount - 1)}
                value={personalSections}
                onChange={e => handlePersonalSectionsChange(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />

              {/* Zero-Pay Single Line Warning */}
              <div className="text-[10px] text-amber-300/90 font-mono flex items-center justify-between pt-0.5">
                <span className="truncate">
                  ⚡ Честный PoR: сеть платит только за <strong>{miningActuallyUsedGb} ГБ</strong> занятых чужих чанков.
                </span>
                <span className="text-slate-500 shrink-0 ml-2">Пустота: 0 NEXX</span>
              </div>
            </div>
          </div>

          {/* Dedicated Scrollable Section Grid / List (flex-1 min-h-0 overflow-y-auto) */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Карта 16-ГБ секций ({totalSectionsCount} шт.)</span>
              </div>

              {/* Mini Legend */}
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded bg-indigo-500" />
                  <span className="text-slate-300">Сейф</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded bg-emerald-500" />
                  <span className="text-slate-300">Занято</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded bg-slate-800 border border-slate-700" />
                  <span className="text-slate-500">Пусто</span>
                </div>
              </div>
            </div>

            {/* Visual Grid of All 16 GB Sections */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {Array.from({ length: totalSectionsCount }).map((_, index) => {
                const isPersonal = index < personalSections;
                const miningIndex = index - personalSections;
                const isOccupiedMining = !isPersonal && (miningIndex < Math.round(miningSections * actualForeignOccupancyRatio));
                
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedSectionDetail(index)}
                    className={`h-16 rounded-xl border p-2 text-left flex flex-col justify-between transition group relative ${
                      isPersonal
                        ? 'bg-indigo-950/40 border-indigo-500/50 hover:border-indigo-400'
                        : isOccupiedMining
                        ? 'bg-emerald-950/40 border-emerald-500/50 hover:border-emerald-400'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    } ${selectedSectionDetail === index ? 'ring-2 ring-white' : ''}`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className={isPersonal ? 'text-indigo-300' : isOccupiedMining ? 'text-emerald-300' : 'text-slate-500'}>
                        #{index + 1}
                      </span>
                      <span className="text-[9px] text-slate-500">16 ГБ</span>
                    </div>
                    <div className="text-[10px] font-mono truncate">
                      {isPersonal ? (
                        <span className="text-indigo-400 font-bold">СЕЙФ</span>
                      ) : isOccupiedMining ? (
                        <span className="text-emerald-400 font-bold">RF=6×</span>
                      ) : (
                        <span className="text-slate-600">ПУСТО</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Section Inspection Detail Modal/Card */}
            {selectedSectionDetail !== null && (
              <div className="p-3 sm:p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 animate-in fade-in">
                <div className="space-y-1 text-xs font-mono min-w-0">
                  <div className="font-bold text-white flex items-center gap-2 truncate">
                    <span>Секция #{selectedSectionDetail + 1} (16 ГБ)</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                      selectedSectionDetail < personalSections
                        ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/30'
                        : selectedSectionDetail - personalSections < Math.round(miningSections * actualForeignOccupancyRatio)
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-900 text-slate-400 border border-slate-700'
                    }`}>
                      {selectedSectionDetail < personalSections
                        ? 'Личный Сейф (ChaCha20)'
                        : selectedSectionDetail - personalSections < Math.round(miningSections * actualForeignOccupancyRatio)
                        ? 'Майнинг (Занято RF=6×)'
                        : 'Майнинг (Пусто • 0 NEXX)'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    Размещение: <strong>{selectedSectionDetail > 3 && selectedSectionDetail <= 27 ? 'Beelink SER9 (Ubuntu 24.04)' : 'Galaxy S9 (Android 24/7)'}</strong>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedSectionDetail(null)}
                  className="text-xs text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. SUBTAB 2: DEVICES BREAKDOWN */}
      {activeSubTab === 'devices' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Fixed Header */}
          <div className="p-3 bg-slate-950/80 border-b border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between shrink-0">
            <span>Всего подключено устройств: <strong className="text-white">{nodes.length}</strong></span>
            <span className="text-emerald-400 font-bold">{nodes.filter(n => n.isOnline).length} онлайн</span>
          </div>

          {/* Dedicated Scrollable List of Devices */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-4 space-y-2.5">
            {nodes.map(node => {
              const nodeSections = Math.floor(node.totalStorageAllocatedGb / 16);
              const nodeActiveGb = node.actualForeignChunksStoredGb;
              const nodeEmptyGb = node.emptyUnusedAllocatedGb;

              return (
                <div
                  key={node.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                        {getDeviceIcon(node.deviceType)}
                      </div>
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                          {node.name}
                          {node.isCurrentDevice && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                              Это устройство
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {node.model}
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      node.isOnline ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-red-950 text-red-300'
                    }`}>
                      {node.isOnline ? 'Онлайн' : 'Офлайн'}
                    </span>
                  </div>

                  {/* Stats for this node */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2 sm:p-2.5 rounded-xl border border-slate-800 text-center font-mono text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400">СЕКЦИЙ</div>
                      <div className="text-xs sm:text-sm font-bold text-white mt-0.5">{nodeSections} × 16G</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-emerald-400">ЗАНЯТО</div>
                      <div className="text-xs sm:text-sm font-bold text-emerald-300 mt-0.5">{nodeActiveGb} ГБ</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-amber-400">ДОХОД / ДЕНЬ</div>
                      <div className="text-xs sm:text-sm font-bold text-amber-300 mt-0.5">+{node.dailyEstimatedNexxEarnings}</div>
                    </div>
                  </div>

                  {/* Empty space reminder */}
                  <div className="text-[10px] text-slate-400 flex items-center justify-between font-mono bg-slate-950/50 p-2 rounded-lg">
                    <span>Пустая емкость (0 NEXX):</span>
                    <strong className="text-slate-300">{nodeEmptyGb} ГБ</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. SUBTAB 3: PROOF OF RETRIEVABILITY AUDIT */}
      {activeSubTab === 'por_audit' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Fixed Header */}
          <div className="p-3 bg-slate-950/80 border-b border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between shrink-0">
            <span>Эпоха аудита: <strong className="text-white">#155</strong></span>
            <span className="text-emerald-400 font-bold">100% Верифицировано</span>
          </div>

          {/* Dedicated Scrollable Audit Logs List */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-4 space-y-2">
            {[
              { time: '1 мин назад', chunk: 'chunk_8f19...a02c', node: 'Galaxy S9', status: 'verified', latency: '42 мс', reward: '+0.015 NEXX' },
              { time: '4 мин назад', chunk: 'chunk_110a...d7b3', node: 'Ubuntu Server', status: 'verified', latency: '12 мс', reward: '+0.015 NEXX' },
              { time: '9 мин назад', chunk: 'chunk_99ea...e318', node: 'Pixel 3 XL', status: 'verified', latency: '58 мс', reward: '+0.015 NEXX' },
              { time: '14 мин назад', chunk: 'chunk_c38b...7f04', node: 'Ubuntu Server', status: 'verified', latency: '15 мс', reward: '+0.015 NEXX' },
              { time: '19 мин назад', chunk: 'chunk_55ae...9011', node: 'ThinkPad X230', status: 'verified', latency: '22 мс', reward: '+0.015 NEXX' },
              { time: '26 мин назад', chunk: 'chunk_e112...bb40', node: 'Galaxy S9', status: 'verified', latency: '49 мс', reward: '+0.015 NEXX' },
            ].map((log, i) => (
              <div key={i} className="p-2.5 sm:p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-white font-bold">{log.chunk}</div>
                    <div className="text-[10px] text-slate-400">{log.node} • Ответ: {log.latency}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-400 font-bold">{log.reward}</div>
                  <div className="text-[10px] text-slate-500">{log.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
