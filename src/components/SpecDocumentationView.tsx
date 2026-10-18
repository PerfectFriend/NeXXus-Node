import React, { useState } from 'react';
import { 
  FileText, Download, Copy, Check, ArrowLeft, Shield, 
  Cpu, Layers, Zap, Lock, Terminal, BookOpen
} from 'lucide-react';

interface SpecDocumentationViewProps {
  onNavigateBackToChat: () => void;
}

export const SpecDocumentationView: React.FC<SpecDocumentationViewProps> = ({
  onNavigateBackToChat,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<'all' | 'crypto' | 'sections' | 'protocols' | 'enclave'>('all');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/docs/NEXXUS_SPECIFICATION_V2.md';
    link.download = 'NEXXUS_SPECIFICATION_V2.md';
    link.click();
  };

  const handleCopySpec = () => {
    navigator.clipboard.writeText(`NEXXUS PROTOCOL SPECIFICATION v2.0\nCryptophone OS, Storage Swarm & Onion P2P Mesh\nStandard for Grok, Claude Opus & Nvidia Nemotron Ultra`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0b0f17] text-slate-100 overflow-hidden h-full">
      {/* Top Header (shrink-0) */}
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
              <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">Техническое Задание NeXXus v2.0</span>
            </h1>
            <p className="text-[10px] text-slate-400 hidden sm:block truncate">
              Спецификация протокола для репликации в Grok, Claude Opus и Nemotron Ultra
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleCopySpec}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-xs font-mono"
            title="Копировать спецификацию"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Скопировано!' : 'Копировать'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition flex items-center gap-1 text-xs font-mono shadow-md shadow-emerald-500/20"
            title="Скачать полный файл ТЗ (.md)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Скачать ТЗ (.md)</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs (shrink-0) */}
      <div className="bg-slate-950/70 border-b border-slate-800/80 px-3 sm:px-6 py-2 flex items-center gap-1.5 overflow-x-auto shrink-0 no-scrollbar">
        {[
          { id: 'all', label: 'Все разделы' },
          { id: 'crypto', label: '1. Криптография & BIP-39' },
          { id: 'sections', label: '2. Секции 16GB & Бартер' },
          { id: 'protocols', label: '3. SMP, xFTP & PoR' },
          { id: 'enclave', label: '4. Panic PIN & Mobile UX' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition shrink-0 ${
              activeSection === tab.id
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scrollable Specification Content (Only this scrolls!) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-6 space-y-4 max-w-4xl mx-auto w-full font-mono text-xs text-slate-300 leading-relaxed">
        
        {/* Intro Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-cyan-950/40 to-slate-900 border border-emerald-500/30 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Shield className="w-4 h-4" />
            <span>NEXXUS SPECIFICATION STANDARD v2.0.4</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Данный документ является эталонным стандартом архитектуры NeXXus. Любая нейросеть (Grok, Claude Opus, Nemotron Ultra) или независимая команда инженеров, реализующая данную спецификацию, создаст клиент, полностью совместимый с существующим роем нод.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] text-cyan-300">
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-cyan-500/30">RFC Compatible</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-emerald-500/30">Deterministic Derivation</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-purple-500/30">Zero Server Metadata</span>
          </div>
        </div>

        {/* SECTION 1: CRYPTOGRAPHY */}
        {(activeSection === 'all' || activeSection === 'crypto') && (
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 text-emerald-400">
              <Lock className="w-4 h-4" /> 1. Криптографический Стек & BIP-39
            </h2>
            <div className="space-y-2 text-[11px] text-slate-300">
              <p>• <strong>BIP-39 Mnemonic:</strong> 12 или 24 слова, PBKDF2(HMAC-SHA512, 2048 итераций, salt="mnemonic"+passphrase).</p>
              <p>• <strong>Деривационный путь:</strong> <code className="text-cyan-300 bg-slate-950 px-1 py-0.5 rounded">m/44'/999'/0'/0/0</code>.</p>
              <p>• <strong>Ключи:</strong> Ed25519 для подписи (RFC 8032), X25519 для Diffie-Hellman (RFC 7748).</p>
              <p>• <strong>Симметричное шифрование:</strong> ChaCha20-Poly1305 AEAD (RFC 8439) с уникальным 96-битным nonce.</p>
              <p>• <strong>Адресация:</strong> Bech32 с префиксом <code className="text-emerald-300">nx1q...</code> и Tor Onion v3 (56 символов Base32 + .onion:9050).</p>
            </div>
          </div>
        )}

        {/* SECTION 2: STORAGE SECTIONS & BARTER */}
        {(activeSection === 'all' || activeSection === 'sections') && (
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 text-cyan-400">
              <Layers className="w-4 h-4" /> 2. Секционное Хранилище 16 ГБ & Экономика Бартера
            </h2>
            <div className="space-y-2 text-[11px] text-slate-300">
              <p>• <strong>Квант 16 ГБ:</strong> Хранилище делится на неделимые секции по 16 ГБ.</p>
              <p>• <strong>Базовое правило:</strong> Первая секция 16 ГБ дает право на 2.0 ГБ личного неуничтожимого сейфа в рое.</p>
              <p>• <strong>Правило 1/8:</strong> Каждая следующая секция 16 ГБ добавляет +2.0 ГБ личной квоты: <code className="text-cyan-300">Quota = 2.0 + (N - 1) * 2.0 ГБ</code>.</p>
              <p>• <strong>Оплата только за занятое:</strong> Неиспользуемые секции отдаются под майнинг. Сеть платит 1.25 NEXX/ГБ/день только за реально размещенные чужие чанки. За пустое пространство выплаты <strong>0 NEXX</strong>.</p>
              <p>• <strong>Вестинг 56 дней:</strong> Награды storer блокируются на 8 недель для предотвращения sybil-сбросов.</p>
            </div>
          </div>
        )}

        {/* SECTION 3: PROTOCOLS */}
        {(activeSection === 'all' || activeSection === 'protocols') && (
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 text-purple-400">
              <Zap className="w-4 h-4" /> 3. Сетевые Протоколы: SMP, xFTP & PoR
            </h2>
            <div className="space-y-2 text-[11px] text-slate-300">
              <p>• <strong>SMP (Simple Messaging Protocol):</strong> Двойной храповик (Double Ratchet) поверх Onion v3. Нулевые логи метаданных.</p>
              <p>• <strong>xFTP (Chunk Transport Protocol):</strong> Размер блока строго 16 384 байта (16 КБ). RF=6 для Hot Tier, RF=4 для Cold Archive.</p>
              <p>• <strong>Proof-of-Retrievability (PoR):</strong> Челлендж листьев дерева Меркла каждые 6 часов. Обнуление штрафных таймеров простоя при прохождении 3 последовательных раундов.</p>
            </div>
          </div>
        )}

        {/* SECTION 4: ANTI-TORTURE ENCLAVE & MOBILE UX */}
        {(activeSection === 'all' || activeSection === 'enclave') && (
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 text-red-400">
              <Shield className="w-4 h-4" /> 4. Panic Duress PIN & Mobile One-Screen UX
            </h2>
            <div className="space-y-2 text-[11px] text-slate-300">
              <p>• <strong>Panic PIN:</strong> Вход под принуждением активирует Decoy Mode (пустой сейф, 0 балансов, отсутствие следов реальных ключей).</p>
              <p>• <strong>Экспоненциальный кулдаун:</strong> Задержка ввода удваивается при каждой ошибке: <code className="text-red-300">T = 5 * 2^(k-1) секунд</code> (5s, 10s, 20s, 40s, 80s...).</p>
              <p>• <strong>Мобильная эргономика:</strong> Приложение жестко заблокировано от внешней прокрутки страницы. Все панели, заголовки и кнопки помещаются в один экран, а прокручиваются исключительно списки.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
