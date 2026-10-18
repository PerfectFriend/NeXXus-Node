import React, { useState } from 'react';
import { 
  MessageSquare, Send, Paperclip, Shield, Globe, Server, CheckCheck, 
  Lock, Radio, User, Plus, RefreshCw, FileText, ChevronRight, Activity, 
  Terminal, Menu, Star, HardDrive, ShoppingBag, Cpu, BookOpen, 
  Settings, LogOut, ArrowLeft, Search, Check, ShieldAlert,
  QrCode, UserPlus, Sparkles, Share2, Zap
} from 'lucide-react';
import { ChatMessage, NodeRecord, Bip39Identity, VaultFile } from '../types/nexxus';
import { PersonalVaultFileManager } from './PersonalVaultFileManager';
import { ContactManagerModal } from './ContactManagerModal';
import { NetworkSettingsModal } from './NetworkSettingsModal';

interface MessengerViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, attachment?: { name: string; sizeBytes: number; chunksCount: number; fileId: string }) => void;
  currentNode: NodeRecord;
  onTogglePrivateServer: () => void;
  identity: Bip39Identity;
  files: VaultFile[];
  onAddFile: (file: VaultFile) => void;
  onDeleteFile?: (fileId: string) => void;
  nodes: NodeRecord[];
  personalSectionsCount: number;
  personalVaultQuotaGb: number;
  onOpenDrawerTab: (tab: 'sections' | 'fleet' | 'appstore' | 'dex' | 'security' | 'manual' | 'spec' | 'splash') => void;
  onQuickLock: () => void;
  isDecoyMode?: boolean;
}

interface ContactItem {
  id: string;
  name: string;
  isVault?: boolean;
  onionAddress: string;
  avatarColor: string;
  status: 'online' | 'relay_connected' | 'encrypted_vault';
  lastSeen: string;
  unreadCount?: number;
}

export const MessengerView: React.FC<MessengerViewProps> = ({
  messages,
  onSendMessage,
  currentNode,
  onTogglePrivateServer,
  identity,
  files,
  onAddFile,
  onDeleteFile,
  nodes,
  personalSectionsCount,
  personalVaultQuotaGb,
  onOpenDrawerTab,
  onQuickLock,
  isDecoyMode = false,
}) => {
  // Selected conversation or vault (null = show chats list on mobile)
  const [selectedId, setSelectedId] = useState<string | null>('vault_favorites');
  const [inputText, setInputText] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const [customContacts, setCustomContacts] = useState<ContactItem[]>([]);

  const handleAddCustomContact = (c: { name: string; onionAddress: string }) => {
    const newContact: ContactItem = {
      id: `custom_${Date.now()}`,
      name: c.name,
      onionAddress: c.onionAddress,
      avatarColor: 'bg-emerald-600',
      status: 'online',
      lastSeen: 'В сети через SMP',
    };
    setCustomContacts(prev => [newContact, ...prev]);
    setSelectedId(newContact.id);
  };

  // Contacts list
  const realContacts: ContactItem[] = [
    {
      id: 'contact_alice',
      name: 'Alice (Guardian #4)',
      onionAddress: 'alice4p8q1w4e7r0t2y5u8i1o4p7a0s3d6f9g2h5j8k1l4z7x0c.onion:9050',
      avatarColor: 'bg-emerald-600',
      status: 'online',
      lastSeen: 'В сети через SMP',
    },
    {
      id: 'contact_bob',
      name: 'Bob (Old Pixel Node 24/7)',
      onionAddress: 'bob3x98a1b2c3d4e5f60718293a4b5c6d7e8f90123456789a.onion:9050',
      avatarColor: 'bg-cyan-600',
      status: 'relay_connected',
      lastSeen: 'Домашняя нода на зарядке',
    },
    {
      id: 'contact_cipher',
      name: 'Satoshi (Cold Swarm)',
      onionAddress: 'satoshi77a4b8c2d6e0f4g8h2i6j0k4l8m2n6o0p4q8r2s6t0u4.onion:9050',
      avatarColor: 'bg-purple-600',
      status: 'online',
      lastSeen: 'Маршрутизация Tor v3',
    },
    {
      id: 'contact_swarm_alerts',
      name: 'NeXXus Network Channel',
      onionAddress: 'system.nexxus.onion:9050',
      avatarColor: 'bg-blue-600',
      status: 'online',
      lastSeen: 'Официальные уведомления',
    }
  ];

  const decoyContacts: ContactItem[] = [
    {
      id: 'contact_echo',
      name: 'NeXXus Echo Service',
      onionAddress: 'echo.testnet.onion:9050',
      avatarColor: 'bg-slate-600',
      status: 'online',
      lastSeen: 'Тестовый бот',
    }
  ];

  const activeContactsList = isDecoyMode ? decoyContacts : [...customContacts, ...realContacts];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleSendMockXftpFile = () => {
    const fileName = `secure_chunk_mesh_${Math.floor(Math.random() * 900 + 100)}.xftp`;
    onSendMessage(
      `Отправляю зашифрованный файл через xFTP (нарезка на 16Кб чанки по стандарту NeXXus RF=6×):`,
      {
        name: fileName,
        sizeBytes: 96 * 1024,
        chunksCount: 6,
        fileId: `xftp_${Date.now()}`,
      }
    );
  };

  const activeContact = activeContactsList.find(c => c.id === selectedId);

  // Storage metric for Избранное badge
  const totalUsedBytes = files.reduce((sum, f) => sum + f.sizeBytes, 0);
  const totalUsedGb = totalUsedBytes / (1024 * 1024 * 1024);

  return (
    <div className="h-screen flex flex-col bg-[#0b0f17] text-slate-100 overflow-hidden select-none">
      {/* Slide-over Navigation Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative w-80 max-w-full bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-5 z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="space-y-6">
              {/* Drawer Header & Profile */}
              <div className="space-y-3 pb-4 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center font-bold text-slate-950 font-mono shadow-md">
                      NX
                    </div>
                    <div>
                      <h2 className="text-sm font-bold font-mono text-white">NeXXus Protocol</h2>
                      <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Onion v3 • Active
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>

                {/* Identity address snippet */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono space-y-1">
                  <div className="text-slate-400 flex items-center justify-between">
                    <span>Адрес аккаунта:</span>
                    <span className="text-emerald-400 font-bold">{identity.balances.nexx.toFixed(1)} NEXX</span>
                  </div>
                  <div className="text-slate-300 truncate">
                    {identity.accountAddress || 'nx1q_sovereign_identity...'}
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1 text-xs font-mono">
                <button
                  onClick={() => {
                    setSelectedId('vault_favorites');
                    setIsDrawerOpen(false);
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white transition flex items-center gap-3 text-left"
                >
                  <Star className="w-4 h-4 text-amber-400" />
                  <span>⭐️ Избранное (Хранилище)</span>
                </button>

                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onOpenDrawerTab('sections');
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white transition flex items-center gap-3 text-left"
                >
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span>Дашборд Секций и Майнинга</span>
                </button>

                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onOpenDrawerTab('fleet');
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white transition flex items-center gap-3 text-left"
                >
                  <Server className="w-4 h-4 text-cyan-400" />
                  <span>Флот Устройств & Криптофон</span>
                </button>

                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onOpenDrawerTab('appstore');
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white transition flex items-center gap-3 text-left"
                >
                  <ShoppingBag className="w-4 h-4 text-purple-400" />
                  <span>dApp Store (Магазин приложений)</span>
                </button>

                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onOpenDrawerTab('dex');
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white transition flex items-center gap-3 text-left"
                >
                  <Activity className="w-4 h-4 text-yellow-400" />
                  <span>DEX Биржа (Обмен NEXX/TON)</span>
                </button>

                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setIsNetworkModalOpen(true);
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white transition flex items-center gap-3 text-left"
                >
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span>Сетевые настройки (VPN / Tor)</span>
                </button>

                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setIsContactModalOpen(true);
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white transition flex items-center gap-3 text-left"
                >
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <span>Контакты & QR-Визитка</span>
                </button>

                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onOpenDrawerTab('spec');
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white transition flex items-center gap-3 text-left"
                >
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Техническое задание (ТЗ) v2.0</span>
                </button>

                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onOpenDrawerTab('splash');
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white transition flex items-center gap-3 text-left"
                >
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>Инициализация и Бридж Сети</span>
                </button>

                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onOpenDrawerTab('security');
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white transition flex items-center gap-3 text-left"
                >
                  <Settings className="w-4 h-4 text-blue-400" />
                  <span>Безопасность и PIN-коды</span>
                </button>

                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onOpenDrawerTab('manual');
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white transition flex items-center gap-3 text-left"
                >
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <span>Инструкция и GitHub репо</span>
                </button>
              </nav>
            </div>

            {/* Bottom Quick Lock Button */}
            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  onQuickLock();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-200 font-mono text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4 text-red-400" />
                <span>Заблокировать приложение</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main App Layout: Responsive Messenger (1-Screen Fullscreen on Mobile) */}
      <div className="flex-1 flex overflow-hidden h-full">
        
        {/* Left Column: Chats & Favorites List (Full width on mobile when no chat selected, hidden on mobile when chat/vault is active) */}
        <div className={`${selectedId ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 border-r border-slate-800 bg-slate-950 flex-col shrink-0 h-full overflow-hidden`}>
          {/* Top Bar with Hamburger, Title, and Quick Lock */}
          <div className="p-3 border-b border-slate-800 flex items-center justify-between gap-2 bg-slate-900/80 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                title="Меню и Настройки"
              >
                <Menu className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-sm font-bold font-mono text-white flex items-center gap-1.5">
                  NeXXus
                </h1>
                <div className="text-[10px] text-slate-400 font-mono">
                  {currentNode.smpServerRunning ? 'Приватный сервер активен' : 'Onion v3'}
                </div>
              </div>
            </div>

            {/* Quick Actions: Network, QR, Add Contact & Lock */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsNetworkModalOpen(true)}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 border border-slate-700/60 transition"
                title="Сетевые настройки (VPN / Tor)"
              >
                <Globe className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsContactModalOpen(true)}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-slate-700/60 transition"
                title="Мой QR-код и контакты"
              >
                <QrCode className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onQuickLock}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-800/80 hover:bg-red-950 hover:text-red-300 border border-slate-700/60 hover:border-red-500/40 text-slate-300 transition flex items-center gap-1 text-xs font-mono"
                title="Свернуть и мгновенно заблокировать PIN-кодом (Esc)"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Блок</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-2 border-b border-slate-800/80 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Поиск диалогов и файлов..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Conversations & Pinned Vault (Scrollable List Only) */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5">
            {/* PINNED ITEM #1: ИЗБРАННОЕ (ЛИЧНЫЙ СЕЙФ) */}
            <button
              onClick={() => setSelectedId('vault_favorites')}
              className={`w-full p-2.5 sm:p-3 rounded-2xl transition text-left flex items-center gap-3 border ${
                selectedId === 'vault_favorites'
                  ? 'bg-gradient-to-r from-amber-950/40 via-indigo-950/40 to-slate-900 border-amber-500/50 shadow-md'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md text-white">
                <Star className="w-5 h-5 fill-white text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs sm:text-sm text-white truncate flex items-center gap-1.5">
                    <span>⭐️ Избранное</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
                      СЕЙФ
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold shrink-0">
                    {totalUsedGb.toFixed(1)}/{personalVaultQuotaGb.toFixed(0)} GB
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                  Персональный диск • ChaCha20
                </div>
              </div>
            </button>

            {/* Regular Chat Contacts */}
            <div className="pt-2 px-1 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              {isDecoyMode ? 'Тестовые Контакты' : 'P2P Мессенджер (SMP / xFTP)'}
            </div>

            {activeContactsList
              .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(contact => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedId(contact.id)}
                  className={`w-full p-2 sm:p-2.5 rounded-2xl transition text-left flex items-center gap-3 border ${
                    selectedId === contact.id
                      ? 'bg-slate-800 border-emerald-500/50 shadow-sm'
                      : 'border-transparent hover:bg-slate-900 hover:border-slate-800'
                  }`}
                >
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl ${contact.avatarColor} flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm`}>
                    {contact.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-white truncate">
                        {contact.name}
                      </div>
                      <span className="text-[9px] font-mono text-slate-500">
                        SMP
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {contact.lastSeen}
                    </div>
                  </div>
                </button>
              ))}
          </div>

          {/* Quick status footer */}
          <div className="p-2.5 border-t border-slate-800 bg-slate-900/60 text-[11px] font-mono text-slate-400 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Шифрование E2EE</span>
            </div>
            <button
              onClick={() => onOpenDrawerTab('sections')}
              className="text-emerald-400 hover:underline"
            >
              Секции: {personalSectionsCount}
            </button>
          </div>
        </div>

        {/* Right Main Column: File Manager, E2EE Chat, or Desktop Placeholder */}
        <div className={`${!selectedId ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-[#0b0f17] h-full overflow-hidden`}>
          {!selectedId ? (
            /* Empty State on Desktop */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 font-mono">
              <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-3">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-300">Выберите диалог или сейф</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Откройте ⭐️ Избранное для доступа к вашему зашифрованному диску или выберите контакт для P2P общения.
              </p>
            </div>
          ) : selectedId === 'vault_favorites' ? (
            /* ⭐️ PERSONAL VAULT FILE MANAGER IN RIGHT PANE */
            <PersonalVaultFileManager
              files={files}
              onAddFile={onAddFile}
              onDeleteFile={onDeleteFile}
              nodes={nodes}
              personalSectionsCount={personalSectionsCount}
              personalVaultQuotaGb={personalVaultQuotaGb}
              isDecoyMode={isDecoyMode}
              onBackToChatList={() => setSelectedId(null)}
            />
          ) : (
            /* 💬 E2EE CHAT INTERFACE */
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Chat Header */}
              <div className="bg-slate-900/90 border-b border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setSelectedId(null)}
                    className="md:hidden p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-xs font-semibold shrink-0"
                    title="Назад к списку чатов"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-[11px]">Чаты</span>
                  </button>

                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-2xl ${activeContact?.avatarColor || 'bg-slate-700'} flex items-center justify-center text-white font-bold text-xs sm:text-sm shrink-0 shadow-md`}>
                    {activeContact?.name.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-bold text-white text-xs sm:text-sm truncate flex items-center gap-1.5 sm:gap-2">
                      <span>{activeContact?.name || 'Диалог'}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                        SMP
                      </span>
                    </h2>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      {activeContact?.onionAddress || currentNode.onionAddress}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleSendMockXftpFile}
                    className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs font-mono flex items-center gap-1.5"
                    title="Отправить 16-Кб тестовый файл через xFTP"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden md:inline">xFTP Файл</span>
                  </button>
                </div>
              </div>

              {/* Chat Messages Timeline */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                <div className="text-center my-2">
                  <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                    🔒 Сквозное шифрование ChaCha20-Poly1305 поверх Tor v3 Onion
                  </span>
                </div>

                {messages.map(msg => {
                  const isMe = msg.senderId === 'current_user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-md sm:max-w-lg rounded-2xl p-3.5 text-xs shadow-md space-y-1.5 ${
                          isMe
                            ? 'bg-emerald-600 text-white rounded-br-none'
                            : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none'
                        }`}
                      >
                        {!isMe && (
                          <div className="text-[10px] font-mono font-bold text-emerald-400">
                            {msg.senderName}
                          </div>
                        )}

                        <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                        {/* xFTP Attachment Preview */}
                        {msg.attachment && (
                          <div className={`p-2.5 rounded-xl border mt-2 flex items-center gap-2.5 ${
                            isMe ? 'bg-emerald-700/60 border-emerald-500/40' : 'bg-slate-950 border-slate-800'
                          }`}>
                            <FileText className="w-5 h-5 text-cyan-300 shrink-0" />
                            <div className="min-w-0 flex-1 font-mono text-[11px]">
                              <div className="font-bold truncate text-white">{msg.attachment.name}</div>
                              <div className="text-[10px] text-slate-300">
                                {(msg.attachment.sizeBytes / 1024).toFixed(1)} KB • {msg.attachment.chunksCount} чанков RF=6×
                              </div>
                            </div>
                          </div>
                        )}

                        <div className={`flex items-center justify-end gap-1 text-[10px] font-mono ${
                          isMe ? 'text-emerald-200' : 'text-slate-500'
                        }`}>
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMe && <CheckCheck className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSend}
                className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900/80 flex items-center gap-2 shrink-0"
              >
                <button
                  type="button"
                  onClick={handleSendMockXftpFile}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  title="Прикрепить файл (xFTP нарезка)"
                >
                  <Paperclip className="w-4 h-4 text-cyan-400" />
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Написать сообщение в Onion v3..."
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-bold transition shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Contact Manager & QR Modal */}
      <ContactManagerModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        identity={identity}
        onionAddress={currentNode.onionAddress}
        onAddContact={handleAddCustomContact}
      />

      {/* Network & Tor/VPN Config Modal */}
      <NetworkSettingsModal
        isOpen={isNetworkModalOpen}
        onClose={() => setIsNetworkModalOpen(false)}
        onionAddress={currentNode.onionAddress}
      />
    </div>
  );
};
