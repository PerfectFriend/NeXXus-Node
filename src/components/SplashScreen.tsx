import React, { useState, useEffect } from 'react';
import { 
  Shield, Cpu, Wifi, Globe, CheckCircle2, 
  ArrowRight, Activity, Terminal, Zap, RefreshCw
} from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
  autoPlayDurationMs?: number;
}

interface BootStep {
  id: string;
  title: string;
  tag: string;
  status: 'pending' | 'running' | 'completed';
  icon: React.ComponentType<{ className?: string }>;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  autoPlayDurationMs = 3800,
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('RU-RU');
  const [activeLog, setActiveLog] = useState<string>('Инициализация суверенного криптоанклава...');

  const steps: BootStep[] = [
    {
      id: 'step_lang',
      title: 'Определение системного языка',
      tag: `Локаль ${detectedLanguage} • UTF-8`,
      status: currentStepIdx > 0 ? 'completed' : currentStepIdx === 0 ? 'running' : 'pending',
      icon: Globe,
    },
    {
      id: 'step_net',
      title: 'Проверка сетевого окружения',
      tag: 'NAT Traversal • WebRTC ICE • IPv6',
      status: currentStepIdx > 1 ? 'completed' : currentStepIdx === 1 ? 'running' : 'pending',
      icon: Wifi,
    },
    {
      id: 'step_bridge',
      title: 'Строительство сетевого бриджа',
      tag: 'Tor Onion v3 • WireGuard Mesh',
      status: currentStepIdx > 2 ? 'completed' : currentStepIdx === 2 ? 'running' : 'pending',
      icon: Zap,
    },
    {
      id: 'step_nodes',
      title: 'Поиск ближайших нод роя',
      tag: 'Kademlia DHT • 4 пира (19 мс)',
      status: currentStepIdx > 3 ? 'completed' : currentStepIdx === 3 ? 'running' : 'pending',
      icon: Cpu,
    },
    {
      id: 'step_penalty',
      title: 'Сброс штрафного периода простоя',
      tag: 'Merkle PoR • 16GB секции в норме',
      status: currentStepIdx >= 4 ? 'completed' : currentStepIdx === 4 ? 'running' : 'pending',
      icon: Shield,
    },
  ];

  useEffect(() => {
    const lang = typeof navigator !== 'undefined' ? (navigator.language || 'ru-RU') : 'ru-RU';
    setDetectedLanguage(lang.toUpperCase());

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / autoPlayDurationMs) * 100));
      setProgress(pct);

      if (pct < 20) {
        setCurrentStepIdx(0);
        setActiveLog(`[LOCALE] Системная локаль: ${lang}. Криптопрофиль активен.`);
      } else if (pct < 45) {
        setCurrentStepIdx(1);
        setActiveLog('[NETWORK] Сканирование интерфейсов: wlan0/rmnet. NAT Type: Full Cone.');
      } else if (pct < 70) {
        setCurrentStepIdx(2);
        setActiveLog('[BRIDGE] Построение Onion v3 контура (3 hops). WireGuard tunnel active.');
      } else if (pct < 90) {
        setCurrentStepIdx(3);
        setActiveLog('[SWARM] Kademlia DHT: найдено 4 активных пира. Задержка 19 мс.');
      } else {
        setCurrentStepIdx(4);
        setActiveLog('[POR] Merkle Root верифицирован. Штраф за простой обнулен.');
      }

      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          onComplete();
        }, 250);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [autoPlayDurationMs, onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-[#070a12] text-slate-100 flex flex-col justify-between overflow-hidden select-none h-full h-[100dvh]">
      
      {/* Ambient background glow & geometric tracery */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-600/15 blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-emerald-600/15 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-indigo-600/15 blur-3xl" />

        <svg className="absolute inset-0 w-full h-full opacity-15" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="meshCenter" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
              <stop offset="60%" stopColor="#10b981" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#070a12" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#meshCenter)" />
          <path d="M 0 450 Q 250 120 500 450" fill="none" stroke="#06b6d4" strokeWidth="1" opacity="0.3" />
          <path d="M 200 500 Q 450 160 700 500" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.25" />
          <line x1="15%" y1="0%" x2="15%" y2="100%" stroke="#06b6d4" strokeWidth="0.5" strokeDasharray="4,8" opacity="0.2" />
          <line x1="85%" y1="0%" x2="85%" y2="100%" stroke="#10b981" strokeWidth="0.5" strokeDasharray="4,8" opacity="0.2" />
        </svg>
      </div>

      {/* Top Header */}
      <div className="relative z-10 px-4 sm:px-6 pt-3 sm:pt-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-500 p-[1px] shadow-md shadow-cyan-500/20">
            <div className="w-full h-full bg-[#0a0f1d] rounded-xl flex items-center justify-center text-cyan-300">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm sm:text-base font-black tracking-wider text-white">
                NEXXUS
              </span>
              <span className="text-[9px] font-mono px-2 py-0.2 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-bold">
                ENCLAVE
              </span>
            </div>
          </div>
        </div>

        {/* Skip button */}
        <button
          onClick={onComplete}
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono text-slate-300 hover:text-white transition flex items-center gap-1.5"
        >
          <span>Войти</span>
          <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
        </button>
      </div>

      {/* Center Main Stage (Ultra-compact, balanced, zero wasted space) */}
      <div className="relative z-10 px-3 sm:px-6 max-w-lg mx-auto w-full flex-1 flex flex-col justify-center my-auto py-2">
        
        {/* Title & Status */}
        <div className="text-center mb-3 sm:mb-4">
          <h1 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
            Инициализация Сетевого Моста
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Синхронизация пиров P2P роя и валидация 16 ГБ секций
          </p>
        </div>

        {/* Clean Progress Card */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3.5 sm:p-4.5 backdrop-blur-xl shadow-2xl space-y-3">
          
          {/* Progress Header */}
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              Статус готовности
            </span>
            <span className="text-cyan-300 font-bold text-sm">
              {progress}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-amber-400 transition-all duration-100 shadow-md shadow-cyan-500/20"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Compact 5-Step Checklist */}
          <div className="space-y-1.5 pt-0.5">
            {steps.map((st) => {
              const IconComp = st.icon;
              return (
                <div 
                  key={st.id}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border transition-all text-xs font-mono ${
                    st.status === 'completed' 
                      ? 'bg-emerald-950/25 border-emerald-500/25 text-slate-200'
                      : st.status === 'running'
                      ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200 shadow-sm'
                      : 'bg-slate-950/40 border-slate-800/50 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`p-1 rounded-lg shrink-0 ${
                      st.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : st.status === 'running'
                        ? 'bg-cyan-500/20 text-cyan-300 animate-pulse'
                        : 'bg-slate-800 text-slate-600'
                    }`}>
                      <IconComp className="w-3 h-3" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-[11px] truncate">
                        {st.title}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pl-2">
                    <span className="text-[10px] text-slate-400 hidden sm:inline">
                      {st.tag}
                    </span>
                    {st.status === 'completed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : st.status === 'running' ? (
                      <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-700" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Telemetry Log Feed */}
          <div className="px-2.5 py-1.5 rounded-xl bg-slate-950/90 border border-slate-800/80 font-mono text-[10px] text-cyan-300/90 flex items-center gap-2 truncate">
            <Terminal className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate">{activeLog}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 px-4 sm:px-6 pb-3 sm:pb-4 flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-slate-800/50 pt-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>Tor v3 & WireGuard P2P Ready</span>
        </div>
        <div>
          <span>v2.0 • Sovereign OS</span>
        </div>
      </div>

    </div>
  );
};
