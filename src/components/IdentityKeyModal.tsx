import React, { useState } from 'react';
import { Key, Copy, Check, RefreshCw, X, Shield, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Bip39Identity } from '../types/nexxus';
import { generateBip39Mnemonic, deriveIdentityFromMnemonic, deriveBipSplitKeys } from '../utils/bip39';

interface IdentityKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  identity: Bip39Identity;
  onUpdateIdentity: (newIdentity: Bip39Identity) => void;
}

export const IdentityKeyModal: React.FC<IdentityKeyModalProps> = ({
  isOpen,
  onClose,
  identity,
  onUpdateIdentity,
}) => {
  const [copiedWords, setCopiedWords] = useState(false);
  const [showWords, setShowWords] = useState(true);
  const [activeTab, setActiveTab] = useState<'mnemonic' | 'bipsplit'>('mnemonic');

  if (!isOpen) return null;

  const bipSplit = deriveBipSplitKeys(identity.mnemonic);

  const handleCopyMnemonic = () => {
    navigator.clipboard.writeText(identity.mnemonic.join(' '));
    setCopiedWords(true);
    setTimeout(() => setCopiedWords(false), 2000);
  };

  const handleGenerateNewKey = () => {
    if (confirm('Внимание: Генерация нового BIP-39 ключа сбросит текущую крипто-идентичность. Продолжить?')) {
      const newMnemonic = generateBip39Mnemonic();
      const derived = deriveIdentityFromMnemonic(newMnemonic);
      onUpdateIdentity({
        ...identity,
        mnemonic: newMnemonic,
        ...derived,
        createdAt: Date.now(),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono">BIP-39 Мнемонический Ключ</h2>
              <p className="text-xs text-slate-400">Единый мастер-ключ для авторизации всех ваших нод и хранилища</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('mnemonic')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'mnemonic'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            12 Слов Мнемоники
          </button>
          <button
            onClick={() => setActiveTab('bipsplit')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'bipsplit'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            BIP-Split Дерево (WS1 Изоляция)
          </button>
        </div>

        {activeTab === 'mnemonic' ? (
          <>
            {/* 12-Word Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">12 Слов Восстановления (BIP-39 Seed):</span>
                <button
                  onClick={() => setShowWords(!showWords)}
                  className="text-slate-400 hover:text-white flex items-center gap-1"
                >
                  {showWords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showWords ? 'Скрыть слова' : 'Показать слова'}</span>
                </button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 p-4 rounded-xl bg-slate-950 border border-slate-800">
                {identity.mnemonic.map((word, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-200"
                  >
                    <span className="text-slate-500 text-[10px] w-4">{idx + 1}.</span>
                    <span className="font-semibold text-amber-300">
                      {showWords ? word : '••••••'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  onClick={handleCopyMnemonic}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                >
                  {copiedWords ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWords ? 'Скопировано!' : 'Копировать 12 слов'}</span>
                </button>

                <button
                  onClick={handleGenerateNewKey}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Сгенерировать новый ключ</span>
                </button>
              </div>
            </div>

            {/* Cryptographic Derivations */}
            <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-medium">Master Public Key:</span>
                <div className="font-mono text-[11px] text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800 break-all">
                  {identity.masterPublicKey}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-medium">Корневой Tor v3 Onion адрес:</span>
                <div className="font-mono text-[11px] text-emerald-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800 break-all">
                  {identity.onionAddress}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* BIP-Split Derivation Tree View */
          <div className="space-y-3.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-1">
              <div className="text-slate-400">Корень: <span className="text-amber-300">BIP-39 Mnemonic Seed</span> (хэш: {bipSplit.masterSeedHash}...)</div>
              <div className="text-slate-500 text-[10px]">Криптографическое ветвление по стандарту BIP-32/44:</div>
            </div>

            {/* Branch 0: Node Identity Key */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono font-bold text-cyan-300">
                  <span className="px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-[10px]">Ветка 0</span>
                  <span>{bipSplit.nodeIdentityPath}</span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded font-mono">
                  Безопасно для ноды-донора
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Используется на старом телефоне для Tor Hidden Service, подписи PoR-ответов и участия в роутинге Kademlia.
              </p>
              <div className="p-2 rounded bg-black/50 font-mono text-[10px] text-slate-300 break-all border border-slate-850">
                Node ID: {bipSplit.nodeIdentityKey}
              </div>
            </div>

            {/* Branch 1: Vault Master Key */}
            <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono font-bold text-purple-300">
                  <span className="px-1.5 py-0.5 rounded bg-purple-950 border border-purple-500/30 text-[10px]">Ветка 1</span>
                  <span>{bipSplit.vaultMasterPath}</span>
                </div>
                <span className="text-[10px] text-red-400 bg-red-950/60 px-2 py-0.5 rounded font-mono">
                  СТРОГО КЛИЕНТСКИЙ КЛЮЧ
                </span>
              </div>
              <p className="text-[11px] text-purple-200/90">
                Симметричный ключ ChaCha20-Poly1305 для расшифровки приватного сейфа. <strong className="text-white">Физически отсутствует на нодах-донорах</strong>.
              </p>
              <div className="p-2 rounded bg-black/60 font-mono text-[10px] text-purple-300 break-all border border-purple-500/30">
                Vault ChaCha Key: {bipSplit.vaultChaChaKeyHex.slice(0, 32)}••••••••••••••••
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-[11px] text-emerald-300 font-mono flex items-center justify-between">
              <span>Донор может расшифровать сейф?</span>
              <strong className="text-red-400 uppercase">НЕТ (Однонаправленная KDF)</strong>
            </div>
          </div>
        )}

        {/* Security Notice (Strict Fitness Gate Hard Rule) */}
        <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-200/90 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-white">Инвариант безопасности NeXXUs:</strong> Этот мастер-сид BIP-39 и ключ расшифровки сейфа (<code className="text-cyan-300 font-mono">.../1'/...</code>) хранятся <em>только на вашем личном клиентском устройстве</em>. На старых телефонах (нодах-донорах) присутствует исключительно Identity-ключ хоста. Даже физическая кража ноды не позволит злоумышленнику прочитать данные вашего сейфа.
          </p>
        </div>
      </div>
    </div>
  );
};
