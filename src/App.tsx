import React, { useState, useEffect } from 'react';
import { 
  NodeRecord, VaultFile, Bip39Identity, ChatMessage, OrderBookItem, 
  SystemPermissionItem, DeviceType 
} from './types/nexxus';
import { 
  INITIAL_IDENTITY, INITIAL_NODES, INITIAL_FILES, INITIAL_MESSAGES, 
  INITIAL_ORDER_BOOK, INITIAL_PERMISSIONS 
} from './data/mockInitialState';
import { MessengerView } from './components/MessengerView';
import { StorageSectionsDashboard } from './components/StorageSectionsDashboard';
import { SwarmFleetView } from './components/SwarmFleetView';
import { AppStoreModal } from './components/AppStoreModal';
import { DexMarketView } from './components/DexMarketView';
import { ManualView } from './components/ManualView';
import { NodeDaemonView } from './components/NodeDaemonView';
import { IdentityKeyModal } from './components/IdentityKeyModal';
import { OnboardingModal } from './components/OnboardingModal';
import { LockScreen } from './components/LockScreen';
import { SplashScreen } from './components/SplashScreen';
import { SystemPermissionsModal } from './components/SystemPermissionsModal';
import { SpecDocumentationView } from './components/SpecDocumentationView';
import { isUserOnboarded } from './utils/securityPin';
import { healAndResyncChunks } from './utils/chunkEngine';
import { ArrowLeft, Lock, Shield, Server, ShoppingBag, Cpu, Activity, BookOpen, Layers } from 'lucide-react';

// Decoy datasets for Anti-Torture / Panic PIN duress mode
const DECOY_FILES: VaultFile[] = [
  {
    id: 'decoy_file_1',
    name: 'Инструкция_пользователя.pdf',
    sizeBytes: 1024 * 1024 * 1.4,
    mimeType: 'application/pdf',
    chunksCount: 90,
    uploadedAt: Date.now() - 5 * 24 * 3600 * 1000,
    encryptionAlgorithm: 'ChaCha20-Poly1305',
    storageTier: 'hot_rf6',
    rootHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    chunks: [],
  },
  {
    id: 'decoy_file_2',
    name: 'Заметки_по_учебе.txt',
    sizeBytes: 14200,
    mimeType: 'text/plain',
    chunksCount: 1,
    uploadedAt: Date.now() - 2 * 24 * 3600 * 1000,
    encryptionAlgorithm: 'ChaCha20-Poly1305',
    storageTier: 'hot_rf6',
    rootHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    chunks: [],
  }
];

const DECOY_IDENTITY: Bip39Identity = {
  ...INITIAL_IDENTITY,
  mnemonic: ["abandon", "abandon", "abandon", "abandon", "abandon", "abandon", "abandon", "abandon", "abandon", "abandon", "abandon", "about"],
  masterPublicKey: "nx1pk_decoy_unregistered_node_0000000000000000",
  accountAddress: "nx1q_testnet_unregistered_demo_safe",
  onionAddress: "decoydemo9876543210.onion:9050",
  balances: {
    nexx: 0.00,
    ton: 0.00,
    usdc: 0.00,
    eth: 0.00,
    btc: 0.00,
  },
  unlockedNexx: 0.00,
  lockedNexx8Weeks: 0.00,
  vestingBatches: [],
  subscribedStorageGb: 16,
  dailyStorageExpenseNexx: 0,
};

const DECOY_MESSAGES: ChatMessage[] = [
  {
    id: 'decoy_msg_1',
    senderId: 'contact_echo',
    senderName: 'NeXXus Echo Service',
    senderOnion: 'echo.testnet.onion:9050',
    recipientId: 'current_user',
    text: 'Привет! Это тестовая эхо-служба NeXXus. Ваше тестовое соединение работает в штатном режиме.',
    timestamp: Date.now() - 3600 * 1000,
    protocol: 'SMP',
    isRelayedViaPrivateServer: false,
    status: 'delivered',
  }
];

export type ActiveAppView = 'messenger' | 'sections' | 'fleet' | 'appstore' | 'dex' | 'node' | 'manual' | 'spec';

export default function App() {
  // Splash Screen & First-launch Permissions states
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [hasPermissions, setHasPermissions] = useState<boolean>(() => {
    try {
      return localStorage.getItem('nexxus_permissions_granted') === 'true';
    } catch {
      return false;
    }
  });

  // Navigation & Authentication states
  const [activeTab, setActiveTab] = useState<ActiveAppView>('messenger');
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => isUserOnboarded());
  const [isLocked, setIsLocked] = useState<boolean>(() => isUserOnboarded());
  const [isDecoyMode, setIsDecoyMode] = useState<boolean>(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  // Selected device
  const [selectedDeviceType, setSelectedDeviceType] = useState<DeviceType>('android');

  // Multi-device nodes state
  const [nodes, setNodes] = useState<NodeRecord[]>(() => {
    const saved = localStorage.getItem('nexxus_nodes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((n: Partial<NodeRecord>) => {
            const totalAlloc = n.totalStorageAllocatedGb ?? 48;
            const expanded = Math.max(0, totalAlloc - 16);
            const actualForeign = n.actualForeignChunksStoredGb ?? Number((expanded * 0.68).toFixed(1));
            const emptySpace = n.emptyUnusedAllocatedGb ?? Number((expanded - actualForeign).toFixed(1));
            const dailyEarn = n.dailyEstimatedNexxEarnings ?? Number((actualForeign * 1.25).toFixed(2));
            return {
              ...n,
              baseSection16Gb: n.baseSection16Gb ?? 16,
              baseSecretVaultGrantedGb: n.baseSecretVaultGrantedGb ?? 2.0,
              expandedStorageAllocatedGb: n.expandedStorageAllocatedGb ?? expanded,
              actualForeignChunksStoredGb: actualForeign,
              emptyUnusedAllocatedGb: emptySpace,
              dailyEstimatedNexxEarnings: dailyEarn,
              personalVaultQuotaGb: n.personalVaultQuotaGb ?? (2.0 + expanded / 8),
              personalVaultUsedGb: n.personalVaultUsedGb ?? 0,
            } as NodeRecord;
          });
        }
      } catch (e) { /* fallback */ }
    }
    return INITIAL_NODES;
  });

  // Vault Files state
  const [files, setFiles] = useState<VaultFile[]>(() => {
    const saved = localStorage.getItem('nexxus_files');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_FILES;
  });

  // Identity state
  const [identity, setIdentity] = useState<Bip39Identity>(() => {
    const saved = localStorage.getItem('nexxus_identity');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_IDENTITY,
          ...parsed,
          balances: {
            ...INITIAL_IDENTITY.balances,
            ...(parsed.balances || {}),
          },
          unlockedNexx: parsed.unlockedNexx ?? INITIAL_IDENTITY.unlockedNexx ?? 480,
          lockedNexx8Weeks: parsed.lockedNexx8Weeks ?? INITIAL_IDENTITY.lockedNexx8Weeks ?? 770,
          vestingBatches: Array.isArray(parsed.vestingBatches) && parsed.vestingBatches.length > 0
            ? parsed.vestingBatches
            : INITIAL_IDENTITY.vestingBatches,
        };
      } catch (e) { /* fallback */ }
    }
    return INITIAL_IDENTITY;
  });

  // Messages state
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('nexxus_messages');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_MESSAGES;
  });

  const [permissions, setPermissions] = useState<SystemPermissionItem[]>(INITIAL_PERMISSIONS);

  // Storage sections calculation
  const totalAllocatedGb = nodes.reduce((sum, n) => sum + (n.isOnline ? n.totalStorageAllocatedGb : 0), 0);
  const totalSectionsCount = Math.max(1, Math.floor(totalAllocatedGb / 16));

  const [personalSections, setPersonalSections] = useState<number>(() => {
    const saved = localStorage.getItem('nexxus_personal_sections');
    return saved ? Math.min(totalSectionsCount, Math.max(1, parseInt(saved, 10))) : Math.max(2, Math.floor(totalSectionsCount * 0.25));
  });

  const personalVaultQuotaGb = personalSections * 16;

  // Emergency Grace state
  const [graceNodeId, setGraceNodeId] = useState<string | null>(null);
  const [graceRemainingSeconds, setGraceRemainingSeconds] = useState<number | null>(null);
  const [selfHealingNotification, setSelfHealingNotification] = useState<string | null>(null);

  // Persistence
  useEffect(() => {
    if (!isDecoyMode) {
      localStorage.setItem('nexxus_nodes', JSON.stringify(nodes));
    }
  }, [nodes, isDecoyMode]);

  useEffect(() => {
    if (!isDecoyMode) {
      localStorage.setItem('nexxus_files', JSON.stringify(files));
    }
  }, [files, isDecoyMode]);

  useEffect(() => {
    if (!isDecoyMode) {
      localStorage.setItem('nexxus_identity', JSON.stringify(identity));
    }
  }, [identity, isDecoyMode]);

  useEffect(() => {
    if (!isDecoyMode) {
      localStorage.setItem('nexxus_messages', JSON.stringify(messages));
    }
  }, [messages, isDecoyMode]);

  // Current primary node
  const currentNode = nodes.find(n => n.isCurrentDevice) || nodes[0];

  // Grace timer
  useEffect(() => {
    if (!graceNodeId || graceRemainingSeconds === null) return;
    if (graceRemainingSeconds <= 0) {
      handleGracePeriodExpired(graceNodeId);
      return;
    }
    const timer = setInterval(() => {
      setGraceRemainingSeconds(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [graceNodeId, graceRemainingSeconds]);

  const handleGracePeriodExpired = (offlineId: string) => {
    const targetNode = nodes.find(n => n.id === offlineId);
    if (!targetNode) return;
    const updatedNodes = nodes.map(n => {
      if (n.id === offlineId) {
        const penalizedScore = Math.max(50, n.reputationScore - 150);
        return {
          ...n,
          penaltiesCount: n.penaltiesCount + 1,
          reputationScore: penalizedScore,
          reputationTier: penalizedScore >= 601 ? ('Guardian Node (601-850)' as const) : ('Reliable Node (301-600)' as const),
          consecutiveDaysWithoutPenalty: 0,
          graceExpiresAt: null,
        };
      }
      return n;
    });

    const { updatedFiles, reRoutedCount } = healAndResyncChunks(files, offlineId, nodes);
    setNodes(updatedNodes);
    setFiles(updatedFiles);
    setGraceNodeId(null);
    setGraceRemainingSeconds(null);
    setSelfHealingNotification(
      `⚠️ Льготный период 1 час истёк! Нода "${targetNode.name}" оштрафована. Сработал Self-Healing: ${reRoutedCount} чанков эвакуированы.`
    );
    setTimeout(() => setSelfHealingNotification(null), 8000);
  };

  const handleSimulateEmergencyGrace = (nodeId: string) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, isOnline: false, graceExpiresAt: Date.now() + 3600000 } : n));
    setGraceNodeId(nodeId);
    setGraceRemainingSeconds(3600);
  };

  const handleRestoreNode = (nodeId: string) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, isOnline: true, graceExpiresAt: null } : n));
    if (graceNodeId === nodeId) {
      setGraceNodeId(null);
      setGraceRemainingSeconds(null);
    }
  };

  const handleExpireGraceNow = (nodeId: string) => {
    handleGracePeriodExpired(nodeId);
  };

  const handleUpdateCurrentNode = (updated: NodeRecord) => {
    setNodes(prev => prev.map(n => n.id === updated.id ? updated : n));
  };

  const handleTogglePermission = (key: string) => {
    setPermissions(prev => prev.map(p => p.key === key ? { ...p, granted: !p.granted } : p));
  };

  const handleAddFile = (newFile: VaultFile) => {
    setFiles(prev => [newFile, ...prev]);
  };

  const handleDeleteFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Messenger message send
  const handleSendMessage = (text: string, attachment?: { name: string; sizeBytes: number; chunksCount: number; fileId: string }) => {
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: 'current_user',
      senderName: 'Me',
      senderOnion: currentNode.onionAddress,
      recipientId: 'contact_alice',
      text,
      timestamp: Date.now(),
      protocol: attachment ? 'xFTP' : 'SMP',
      attachment,
      isRelayedViaPrivateServer: currentNode.smpServerRunning,
      status: 'delivered',
    };

    setMessages(prev => [...prev, newMsg]);

    setTimeout(() => {
      const replyMsg: ChatMessage = {
        id: `msg_reply_${Date.now()}`,
        senderId: 'contact_alice',
        senderName: 'Alice (Guardian #4)',
        senderOnion: 'alice4p8q1w4e7r0t2y5u8i1o4p7a0s3d6f9g2h5j8k1l4z7x0c.onion:9050',
        recipientId: 'current_user',
        text: attachment 
          ? `Получен xFTP поток чанков "${attachment.name}". 6× репликация (RF=6×) подтверждена кворумом!`
          : `Принято по протоколу SMP через Onion v3 сервис. Сквозное шифрование подтверждено.`,
        timestamp: Date.now(),
        protocol: attachment ? 'xFTP' : 'SMP',
        isRelayedViaPrivateServer: true,
        status: 'delivered',
      };
      setMessages(prev => [...prev, replyMsg]);
    }, 2000);
  };

  const handleTogglePrivateServer = () => {
    handleUpdateCurrentNode({
      ...currentNode,
      smpServerRunning: !currentNode.smpServerRunning,
    });
  };

  const handleAddNewNode = (newNodeData: Partial<NodeRecord>) => {
    const totalAllocated = newNodeData.totalStorageAllocatedGb || 48;
    const baseSection16Gb = 16;
    const baseSecretVaultGrantedGb = 2.0;
    const expandedStorage = Math.max(0, totalAllocated - 16);
    const actualForeignChunks = Number((expandedStorage * 0.68).toFixed(1));
    const emptyUnused = Number((expandedStorage - actualForeignChunks).toFixed(1));
    const dailyEarnings = Number((actualForeignChunks * 1.25).toFixed(2));
    const vaultQuota = Number((baseSecretVaultGrantedGb + (expandedStorage / 8)).toFixed(1));

    const newNode: NodeRecord = {
      id: `node_${Date.now()}`,
      name: newNodeData.name || 'Новое Устройство',
      deviceType: newNodeData.deviceType || 'android',
      model: newNodeData.model || 'Connected Station',
      isOnline: true,
      isCurrentDevice: false,
      onionAddress: newNodeData.onionAddress || 'nexxusnewnode.onion:9050',
      v2rayActive: true,
      torActive: true,
      smpServerRunning: false,
      xFTPRelayRunning: true,
      batteryLevel: 100,
      isCharging: true,
      temperatureC: 33.0,
      wifiSsid: 'Home_WiFi',
      wifiSignalDbm: -50,
      internalTotalGb: newNodeData.internalTotalGb || 64,
      internalFreeGb: newNodeData.internalFreeGb || 50,
      autoModeEnabled: true,
      reservedSections16Gb: newNodeData.reservedSections16Gb || 3,
      totalStorageAllocatedGb: totalAllocated,
      baseSection16Gb,
      baseSecretVaultGrantedGb,
      expandedStorageAllocatedGb: expandedStorage,
      actualForeignChunksStoredGb: actualForeignChunks,
      emptyUnusedAllocatedGb: emptyUnused,
      dailyEstimatedNexxEarnings: dailyEarnings,
      personalVaultQuotaGb: vaultQuota,
      personalVaultUsedGb: 0,
      reputationScore: 400,
      reputationTier: 'Reliable Node (301-600)',
      consecutiveDaysWithoutPenalty: 0,
      penaltiesCount: 0,
      offlineSince: null,
      graceExpiresAt: null,
      storedChunksCount: 0,
      replicatedChunksServed: 0,
      bandwidthSharedMb: 0,
      externalDevices: [],
      ...newNodeData,
    };

    setNodes(prev => [...prev, newNode]);
  };

  // Unlock handler from LockScreen
  const handleUnlock = (isDecoy: boolean) => {
    setIsDecoyMode(isDecoy);
    setIsLocked(false);
  };

  // Complete onboarding
  const handleOnboardingComplete = (newIdentity: Bip39Identity) => {
    setIdentity(newIdentity);
    setIsOnboarded(true);
    setIsLocked(false);
    setIsDecoyMode(false);
  };

  // Quick lock triggers lock screen
  const handleQuickLock = () => {
    setIsLocked(true);
  };

  // Switch drawer tabs
  const handleOpenDrawerTab = (tab: 'sections' | 'fleet' | 'appstore' | 'dex' | 'security' | 'manual' | 'spec' | 'splash') => {
    if (tab === 'security') {
      setIsKeyModalOpen(true);
    } else if (tab === 'splash') {
      setShowSplash(true);
    } else {
      setActiveTab(tab);
    }
  };

  // Active dataset depending on Decoy mode
  const displayedFiles = isDecoyMode ? DECOY_FILES : files;
  const displayedIdentity = isDecoyMode ? DECOY_IDENTITY : identity;
  const displayedMessages = isDecoyMode ? DECOY_MESSAGES : messages;

  return (
    <div className="min-h-full h-full h-[100dvh] max-h-screen w-full bg-[#0b0f17] text-slate-100 flex flex-col font-sans overflow-hidden select-none selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* 0. Sovereign Network Initialization Splash Screen (loads first with progress bar) */}
      {showSplash && (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      )}

      {/* 1. First-Launch System Permissions Wizard (runs before onboarding) */}
      {!showSplash && !hasPermissions && (
        <SystemPermissionsModal
          isOpen={!hasPermissions}
          onConfirm={() => setHasPermissions(true)}
        />
      )}

      {/* 2. Onboarding Wizard if user is not onboarded */}
      {!showSplash && hasPermissions && !isOnboarded && (
        <OnboardingModal
          isOpen={!isOnboarded}
          onComplete={handleOnboardingComplete}
        />
      )}

      {/* 3. Security Lock Screen with doubling exponential cooldown and Panic PIN */}
      {!showSplash && hasPermissions && isOnboarded && isLocked && (
        <LockScreen onUnlock={handleUnlock} />
      )}

      {/* 3. Self-Healing Notification Toast */}
      {selfHealingNotification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-lg bg-slate-900 border border-amber-500/50 p-4 rounded-2xl shadow-2xl text-xs text-amber-200 animate-slide-up flex items-start gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 mt-1 shrink-0 animate-ping" />
          <div className="leading-relaxed">
            {selfHealingNotification}
          </div>
        </div>
      )}

      {/* 4. PRIMARY APPLICATION VIEWS */}
      {/* If activeTab is 'messenger', render the full-screen Telegram/Element UX with Избранное */}
      {activeTab === 'messenger' && (
        <MessengerView
          messages={displayedMessages}
          onSendMessage={handleSendMessage}
          currentNode={currentNode}
          onTogglePrivateServer={handleTogglePrivateServer}
          identity={displayedIdentity}
          files={displayedFiles}
          onAddFile={handleAddFile}
          onDeleteFile={handleDeleteFile}
          nodes={nodes}
          personalSectionsCount={personalSections}
          personalVaultQuotaGb={personalVaultQuotaGb}
          onOpenDrawerTab={handleOpenDrawerTab}
          onQuickLock={handleQuickLock}
          isDecoyMode={isDecoyMode}
        />
      )}

      {/* Sub-panel: Дашборд Секций Хранилища и Майнинга */}
      {activeTab === 'sections' && (
        <StorageSectionsDashboard
          nodes={nodes}
          onUpdateNodes={setNodes}
          identity={displayedIdentity}
          onNavigateBackToChat={() => setActiveTab('messenger')}
        />
      )}

      {/* Sub-panel: dApp Store (Магазин Приложений) */}
      {activeTab === 'appstore' && (
        <AppStoreModal
          onNavigateBackToChat={() => setActiveTab('messenger')}
        />
      )}

      {/* Sub-panel: Флот Устройств (Swarm Fleet) */}
      {activeTab === 'fleet' && (
        <div className="flex-1 flex flex-col bg-[#0b0f17] overflow-hidden h-full">
          <div className="bg-slate-900/95 border-b border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => setActiveTab('messenger')}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-xs font-semibold shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Назад в Чат</span>
                <span className="sm:hidden">Чат</span>
              </button>
              <div className="min-w-0">
                <h1 className="text-xs sm:text-base font-bold text-white font-mono flex items-center gap-1.5 truncate">
                  <Server className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="truncate">Флот Устройств NeXXus Swarm</span>
                </h1>
                <p className="text-[10px] text-slate-400 hidden sm:block truncate">
                  Управление подключенными смартфонами, Ubuntu-серверами и нодами
                </p>
              </div>
            </div>

            <button
              onClick={handleQuickLock}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-300 transition flex items-center gap-1 text-xs font-mono shrink-0"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Заблокировать</span>
            </button>
          </div>

          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <SwarmFleetView
              nodes={nodes}
              identity={displayedIdentity}
              vaultFiles={displayedFiles}
              onUpdateFiles={setFiles}
              onToggleNodeOnline={handleRestoreNode}
              onSimulateEmergencyGrace={handleSimulateEmergencyGrace}
              onExpireGraceNow={handleExpireGraceNow}
              onAddNewNode={handleAddNewNode}
              graceNodeId={graceNodeId}
              graceRemainingSeconds={graceRemainingSeconds}
            />
          </div>
        </div>
      )}

      {/* Sub-panel: DEX Биржа */}
      {activeTab === 'dex' && (
        <div className="flex-1 flex flex-col bg-[#0b0f17] overflow-hidden h-full">
          <div className="bg-slate-900/95 border-b border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => setActiveTab('messenger')}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-xs font-semibold shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Назад в Чат</span>
                <span className="sm:hidden">Чат</span>
              </button>
              <div className="min-w-0">
                <h1 className="text-xs sm:text-base font-bold text-white font-mono flex items-center gap-1.5 truncate">
                  <Activity className="w-4 h-4 text-yellow-400 shrink-0" />
                  <span className="truncate">Децентрализованная Биржа (DEX)</span>
                </h1>
                <p className="text-[10px] text-slate-400 hidden sm:block truncate">
                  Мгновенный обмен NEXX, TON, USDC и BTC без посредников
                </p>
              </div>
            </div>

            <button
              onClick={handleQuickLock}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-300 transition flex items-center gap-1 text-xs font-mono shrink-0"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Заблокировать</span>
            </button>
          </div>

          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <DexMarketView
              identity={displayedIdentity}
              nodes={nodes}
              onUpdateIdentity={setIdentity}
              orders={INITIAL_ORDER_BOOK}
            />
          </div>
        </div>
      )}

      {/* Sub-panel: Инструкция и GitHub */}
      {activeTab === 'manual' && (
        <div className="flex-1 flex flex-col bg-[#0b0f17] overflow-hidden h-full">
          <div className="bg-slate-900/95 border-b border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => setActiveTab('messenger')}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-xs font-semibold shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Назад в Чат</span>
                <span className="sm:hidden">Чат</span>
              </button>
              <div className="min-w-0">
                <h1 className="text-xs sm:text-base font-bold text-white font-mono flex items-center gap-1.5 truncate">
                  <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">Инструкция & Репозиторий</span>
                </h1>
                <p className="text-[10px] text-slate-400 hidden sm:block truncate">
                  Установка ноды на Ubuntu Linux, Android, GitHub PerfectFriend/NeXXus-Node
                </p>
              </div>
            </div>

            <button
              onClick={handleQuickLock}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-300 transition flex items-center gap-1 text-xs font-mono shrink-0"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Заблокировать</span>
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <ManualView
              onNavigateTab={(tab) => {
                if (tab === 'messenger') setActiveTab('messenger');
                else if (tab === 'fleet') setActiveTab('fleet');
                else if (tab === 'dex') setActiveTab('dex');
              }}
              onOpenBip39Modal={() => setIsKeyModalOpen(true)}
            />
          </div>
        </div>
      )}

      {/* Sub-panel: Node Daemon Detailed View */}
      {activeTab === 'node' && (
        <div className="flex-1 flex flex-col bg-[#0b0f17] overflow-hidden">
          <div className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('messenger')}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
              >
                <ArrowLeft className="w-4 h-4" /> Назад в Чат
              </button>
              <div>
                <h1 className="text-base font-bold text-white font-mono flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" /> Демон Ноды: {currentNode.name}
                </h1>
                <p className="text-[11px] text-slate-400">
                  Статус фонового сервиса, Tor Circuit, температура и системные разрешения
                </p>
              </div>
            </div>

            <button
              onClick={handleQuickLock}
              className="p-2 rounded-xl bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-300 transition flex items-center gap-1 text-xs font-mono"
            >
              <Lock className="w-3.5 h-3.5" /> Заблокировать
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <NodeDaemonView
              currentNode={currentNode}
              onUpdateCurrentNode={handleUpdateCurrentNode}
              permissions={permissions}
              onTogglePermission={handleTogglePermission}
              deviceType={selectedDeviceType}
            />
          </div>
        </div>
      )}

      {/* Sub-panel: Техническое Задание (ТЗ) v2.0 */}
      {activeTab === 'spec' && (
        <SpecDocumentationView
          onNavigateBackToChat={() => setActiveTab('messenger')}
        />
      )}

      {/* BIP-39 Key Inspection Modal */}
      {!isDecoyMode && (
        <IdentityKeyModal
          isOpen={isKeyModalOpen}
          onClose={() => setIsKeyModalOpen(false)}
          identity={identity}
          onUpdateIdentity={setIdentity}
        />
      )}
    </div>
  );
}
