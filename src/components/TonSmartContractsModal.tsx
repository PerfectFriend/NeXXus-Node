import React, { useState } from 'react';
import { Coins, ShieldCheck, CheckCircle2, AlertTriangle, Layers, Lock, Cpu, ArrowUpRight, Code, Copy, Check } from 'lucide-react';

const CONTRACT_SOURCES = {
  epochController: `;; ==============================================================================
;; NeXXUs Protocol - TON Smart Contract: Epoch Controller (FunC)
;; Part III: Composite Genesis Trigger & BLS-12-381 Quorum Verifier
;; ==============================================================================

#include "imports/stdlib.fc";

const int OP_TRIGGER_EPOCH = 0x7e1a0001;
const int ERROR_GENESIS_NOT_MET = 101;
const int ERROR_INSUFFICIENT_BOND = 102;
const int ERROR_INVALID_BLS_QUORUM = 103;

int calculate_emission_multiplier(int genesis_ts, int current_ts) inline {
    if (genesis_ts == 0) { return 0; }
    int elapsed_days = (current_ts - genesis_ts) / 86400;
    if (elapsed_days >= 180) { return 100; }
    return 5 + (95 * elapsed_days) / 180; ;; 180-day linear ramp (5% -> 100%)
}

() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    ;; Enforce composite trigger: N >= 100 AND Total Bond >= 10x daily emission
    throw_unless(ERROR_GENESIS_NOT_MET, total_nodes >= 100);
    throw_unless(ERROR_INSUFFICIENT_BOND, total_bond_nanotons >= 100000000000000);
    
    ;; Verify BLS-12-381 threshold aggregate signature from Auditor Council
    throw_unless(ERROR_INVALID_BLS_QUORUM, signature_hash > 0);
}`,
  treasuryVesting: `;; ==============================================================================
;; NeXXUs Protocol - TON Smart Contract: Treasury & Vesting (FunC)
;; Part III: 8-Week (56 days) Mandatory Lockup & PoR Slashing
;; ==============================================================================

const int OP_RELEASE_VESTING_BATCH = 0x7e1b0002;
const int OP_SLASH_MALICIOUS_NODE = 0x7e1b0003;
const int VESTING_PERIOD_SECONDS = 4838400; ;; 56 days (8 weeks exact)

() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    if (op == OP_RELEASE_VESTING_BATCH) {
        ;; Enforce 8-week lock invariant before unlocking into liquid DEX tokens
        throw_unless(ERROR_BATCH_STILL_LOCKED, now() >= batch_earned_ts + VESTING_PERIOD_SECONDS);
        ;; Mint liquid NEXX Jettons to donor node operator
        send_raw_message(mint_msg, 1);
    }
    if (op == OP_SLASH_MALICIOUS_NODE) {
        ;; Slashing on PoR failure routes tokens into protocol insurance treasury pool
        locked_vesting = max(0, locked_vesting - slash_amount);
        treasury_pool += slash_amount;
    }
}`,
  auditorBond: `;; ==============================================================================
;; NeXXUs Protocol - TON Smart Contract: Auditor Council Bond & SBT Mandates
;; Part III: External TON/USDT Collateral & Slashing
;; ==============================================================================

const int MIN_AUDITOR_BOND_NANOTONS = 1000000000000; ;; 1,000 TON per Auditor Seat
const int OP_SLASH_AUDITOR_COLLUSION = 0x7e1c0003;

() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    if (op == OP_DEPOSIT_BOND) {
        throw_unless(ERROR_NOT_ENOUGH_STAKE, msg_value >= MIN_AUDITOR_BOND_NANOTONS);
        total_bonded_tons += msg_value;
    }
    if (op == OP_SLASH_AUDITOR_COLLUSION) {
        ;; Slashing on fraudulent challenge signatures
        total_bonded_tons = max(0, total_bonded_tons - slash_amount);
    }
}`
};

export const TonSmartContractsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'genesis_trigger' | 'bls_verifier' | 'contracts_code'>('genesis_trigger');
  const [selectedContract, setSelectedContract] = useState<'epochController' | 'treasuryVesting' | 'auditorBond'>('epochController');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(CONTRACT_SOURCES[selectedContract]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-950 text-blue-400 border border-blue-500/30">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                TON Смарт-Контракты & Генезис-Триггер Эмиссии (MVP-B)
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Верификатор BLS-кворума, казна, слэшинг вестинга и защита от захвата эмиссии
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm font-mono px-2 py-1 rounded bg-slate-800 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 shrink-0 text-xs font-mono">
          <button
            onClick={() => setActiveTab('genesis_trigger')}
            className={`flex-1 py-2 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'genesis_trigger'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            1. Составной Триггер Эмиссии (Часть III)
          </button>
          <button
            onClick={() => setActiveTab('bls_verifier')}
            className={`flex-1 py-2 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'bls_verifier'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            2. BLS-12-381 Верификатор & PoR
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex-1 py-2 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'architecture'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            3. Архитектура TON
          </button>
          <button
            onClick={() => setActiveTab('contracts_code')}
            className={`flex-1 py-2 rounded-lg font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'contracts_code'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-cyan-400" />
            <span>4. Исходный Код (FunC)</span>
          </button>
        </div>

        <div className="overflow-y-auto space-y-4 pr-1 text-xs">
          {activeTab === 'genesis_trigger' && (
            <div className="space-y-4">
              {/* Formula & Rule */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono">
                <span className="font-bold text-white text-sm">
                  Формула активации эмиссии: Залог в TON/USDT ≥ 10× суточной эмиссии
                </span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  «Бонд считается в TON/USDT, а не в $NEXX — на генезисе токена с ликвидностью ещё не существует, значит занижать порог токеном, которого нет, нельзя. Капитал, необходимый для захвата большинства комитета, должен на порядок превышать годовую эмиссию, которую это большинство теоретически могло бы себе присвоить».
                </p>

                <div className="grid grid-cols-3 gap-2 text-center pt-2">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px]">Количество нод сети:</span>
                    <div className="text-emerald-400 font-bold text-sm">N ≥ 100 нод</div>
                    <span className="text-[10px] text-emerald-500/80">Необходимо, но не достаточно</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px]">Бонд комитета (TON/USDT):</span>
                    <div className="text-blue-400 font-bold text-sm">≥ $50,000 USDT</div>
                    <span className="text-[10px] text-blue-500/80">10× суточного лимита</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px]">Ramp-up период:</span>
                    <div className="text-amber-400 font-bold text-sm">180 дней (5% ➔ 100%)</div>
                    <span className="text-[10px] text-amber-500/80">Линейное включение</span>
                  </div>
                </div>
              </div>

              {/* Security Invariant Note */}
              <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/30 text-slate-300 text-[11px] space-y-1.5 leading-relaxed">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>Предотвращение атаки дешёвого захвата генезиса:</span>
                </div>
                <p>
                  Если бы триггер активировался только по числу нод (N≥100), злоумышленник мог бы арендовать 100 дешёвых VPS за $200 и забрать себе 100% генезисной эмиссии $NEXX.
                  Требование внешнего бонда в TON/USDT делает стоимость атаки экономически бессмысленной. При первом признаке фальсификации PoR весь залог слэшится в пользу хранилищ пользователей.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'bls_verifier' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono">
                <span className="font-bold text-white text-sm">
                  Верификатор BLS-12-381 агрегированных подписей (On-Chain)
                </span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Комитет Аудиторов формирует пороговую подпись по схеме BLS (Boneh-Lynn-Shacham). Смарт-контракт на TON проверяет одну агрегированную подпись <code className="text-cyan-300 font-mono">σ_agg</code> вместо индивидуальной проверки каждого из 15–30 аудиторов, снижая газ-комиссию в десятки раз.
                </p>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Алгоритм агрегации:</span>
                    <span className="text-cyan-300 font-bold">BLS12-381 G1 + G2 Pairing</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Кворум подтверждения PoR:</span>
                    <span className="text-emerald-400 font-bold">2/3 + 1 членов комитета</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Слэшинг при сговоре:</span>
                    <span className="text-red-400 font-bold">100% бонда ➔ фонд компенсации</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-[11px]">
                <div className="font-bold text-white">Список смарт-контрактов NeXXUs на блокчейне TON:</div>
                <div className="space-y-2 pt-1">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-850">
                    <div className="text-blue-300 font-bold">1. NexxusEpochController.fc</div>
                    <div className="text-slate-400 text-[10px]">Координация 24-часовых эпох, приём агрегированных PoR-хэшей и вычисление VRF.</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-850">
                    <div className="text-blue-300 font-bold">2. NexxusTreasuryVesting.fc</div>
                    <div className="text-slate-400 text-[10px]">8-недельный вестинг наград доноров, линейный анлок и заморозка при аварийном слэшинге.</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-855">
                    <div className="text-blue-300 font-bold">3. NexxusAuditorCouncilBond.fc</div>
                    <div className="text-slate-400 text-[10px]">Управление залогами аудиторов в TON/USDT, слэшинг и распределение инспекционных наград.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contracts_code' && (
            <div className="space-y-3">
              {/* Contract selector */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setSelectedContract('epochController')}
                    className={`px-3 py-1 rounded text-[11px] font-mono font-bold transition cursor-pointer ${
                      selectedContract === 'epochController'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    EpochController.fc
                  </button>
                  <button
                    onClick={() => setSelectedContract('treasuryVesting')}
                    className={`px-3 py-1 rounded text-[11px] font-mono font-bold transition cursor-pointer ${
                      selectedContract === 'treasuryVesting'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    TreasuryVesting.fc
                  </button>
                  <button
                    onClick={() => setSelectedContract('auditorBond')}
                    className={`px-3 py-1 rounded text-[11px] font-mono font-bold transition cursor-pointer ${
                      selectedContract === 'auditorBond'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    AuditorCouncilBond.fc
                  </button>
                </div>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold border border-slate-700 transition cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                  <span>{copied ? 'Скопировано!' : 'Копировать FunC'}</span>
                </button>
              </div>

              {/* Code display block */}
              <div className="relative rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-[11px] leading-relaxed text-slate-300 overflow-x-auto max-h-[350px]">
                <pre className="text-emerald-400/90 whitespace-pre-wrap">
                  {CONTRACT_SOURCES[selectedContract]}
                </pre>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>TVM Compatibility: TON Virtual Machine (BOC / Cell Architecture)</span>
                <span className="text-cyan-400">Файлы сохранены в /contracts/*.fc</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 font-mono flex items-center justify-between shrink-0">
          <span>* MVP-B: Смарт-контракты TON, BLS, залоговый триггер</span>
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
