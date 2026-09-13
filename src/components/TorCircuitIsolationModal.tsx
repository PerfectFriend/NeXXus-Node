import React, { useState } from 'react';
import { Globe, Shield, RefreshCw, Layers, CheckCircle2, Zap, ArrowRight, Lock } from 'lucide-react';

export type TransportMode = 'direct_onion' | 'obfs4_bridge' | 'v2ray_websocket';

interface CircuitRecord {
  streamId: string;
  socksAuth: string;
  purpose: string;
  guardNode: string;
  middleNode: string;
  targetOnion: string;
  latencyMs: number;
  status: 'ACTIVE' | 'BUILDING' | 'ROTATING';
}

export const TorCircuitIsolationModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [transportMode, setTransportMode] = useState<TransportMode>('v2ray_websocket');
  const [isRotating, setIsRotating] = useState(false);
  const [circuits, setCircuits] = useState<CircuitRecord[]>([
    {
      streamId: 'stream_chunk_4102',
      socksAuth: 'nexx_iso_9b1a:p2p_4102',
      purpose: 'xFTP Чанк #4102 (16 KB)',
      guardNode: 'guard_nl_fast1 (AS16276)',
      middleNode: 'mid_ch_relay (AS13030)',
      targetOnion: 'alice4p8q1...onion:9050',
      latencyMs: 382,
      status: 'ACTIVE',
    },
    {
      streamId: 'stream_smp_msg_88',
      socksAuth: 'nexx_iso_3c2d:smp_meta',
      purpose: 'SMP E2EE Мессенджер',
      guardNode: 'guard_se_anon (AS2119)',
      middleNode: 'mid_is_nordic (AS51013)',
      targetOnion: 'bob7x9v2...onion:9050',
      latencyMs: 440,
      status: 'ACTIVE',
    },
    {
      streamId: 'stream_por_proof_01',
      socksAuth: 'nexx_iso_7f4e:por_heartbeat',
      purpose: 'Proof-of-Retrievability Heartbeat',
      guardNode: 'guard_ro_privacy (AS9009)',
      middleNode: 'mid_de_exitless (AS24940)',
      targetOnion: 'auditor_comm...onion:9050',
      latencyMs: 295,
      status: 'ACTIVE',
    },
  ]);

  if (!isOpen) return null;

  const handleRotateCircuits = () => {
    setIsRotating(true);
    setTimeout(() => {
      setCircuits(prev =>
        prev.map(c => ({
          ...c,
          latencyMs: Math.floor(Math.random() * 200 + 260),
          socksAuth: `nexx_iso_${Math.random().toString(36).slice(2, 6)}:${c.purpose.slice(0, 5)}`,
        }))
      );
      setIsRotating(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-950 text-purple-400 border border-purple-500/30">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Tor SOCKS5 Изоляция & Pluggable Transports (WS2)
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Изоляция потоков (IsolateSOCKSAuth) и обфускация против цензуры и DPI
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

        {/* Transport Selector */}
        <div className="space-y-2 shrink-0">
          <div className="text-xs font-semibold text-slate-300">Режим маскировки входящего и исходящего трафика:</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              onClick={() => setTransportMode('direct_onion')}
              className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                transportMode === 'direct_onion'
                  ? 'bg-purple-950/60 border-purple-500/80 text-purple-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-bold">Прямой Tor v3</div>
              <div className="text-[10px] text-slate-400 mt-1">Оригинальный onion-роутинг</div>
            </button>

            <button
              onClick={() => setTransportMode('obfs4_bridge')}
              className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                transportMode === 'obfs4_bridge'
                  ? 'bg-cyan-950/60 border-cyan-500/80 text-cyan-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-bold">obfs4 Мосты</div>
              <div className="text-[10px] text-slate-400 mt-1">Рандомизация TLS хэндшейков</div>
            </button>

            <button
              onClick={() => setTransportMode('v2ray_websocket')}
              className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                transportMode === 'v2ray_websocket'
                  ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-bold">v2ray / WebSocket-TLS</div>
              <div className="text-[10px] text-slate-400 mt-1">Неотличим от обычного HTTPS</div>
            </button>
          </div>
        </div>

        {/* Active Circuits with SOCKS5 Isolation */}
        <div className="space-y-3 overflow-y-auto pr-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-400" />
              Изолированные SOCKS5 цепочки (Per-Peer Circuit Isolation):
            </span>

            <button
              disabled={isRotating}
              onClick={handleRotateCircuits}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono font-semibold transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
              <span>{isRotating ? 'Ротация...' : 'Ротировать цепи'}</span>
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {circuits.map((c) => (
              <div key={c.streamId} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-200">{c.purpose}</span>
                  <span className="text-emerald-400 font-semibold">{c.latencyMs} ms RTT</span>
                </div>

                <div className="text-[10px] text-slate-400 bg-slate-900 p-2 rounded border border-slate-850 space-y-1">
                  <div>
                    <span className="text-slate-500">SOCKS5 Auth Token:</span>{' '}
                    <span className="text-cyan-300 font-semibold">{c.socksAuth}</span>{' '}
                    <span className="text-[9px] text-purple-400">(Уникальный Tor Guard)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span>{c.guardNode}</span>
                    <ArrowRight className="w-3 h-3 text-slate-600" />
                    <span>{c.middleNode}</span>
                    <ArrowRight className="w-3 h-3 text-slate-600" />
                    <span className="text-emerald-300">{c.targetOnion}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Hard Gate Threat Model note */}
          <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/40 text-[11px] text-purple-200/90 flex items-start gap-2">
            <Lock className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <p>
              <strong className="text-white">Защита от корреляции трафика (WS2):</strong> Включение флага{' '}
              <code className="text-cyan-300 font-mono">IsolateSOCKSAuth</code> заставляет Tor строить абсолютно независимые цепи для каждого чанка и каждого контакта. Провайдер или глобальный наблюдатель не могут сопоставить чанки одного файла по таймингам.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 font-mono flex items-center justify-between shrink-0">
          <span>* Ветка WS2: Tor Hidden Service + v2ray pluggable transport</span>
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
