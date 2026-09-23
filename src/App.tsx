import React, { useState, useEffect } from 'react';
import { 
  NodeRecord, VaultFile, Bip39Identity, ChatMessage, OrderBookItem, 
  SystemPermissionItem, DeviceType 
} from './types/nexxus';
import { 
  INITIAL_IDENTITY, INITIAL_NODES, INITIAL_FILES, INITIAL_MESSAGES, 
  INITIAL_ORDER_BOOK, INITIAL_PERMISSIONS 
} from './data/mockInitialState';
import { Header } from './components/Header';
import { NodeDaemonView } from './components/NodeDaemonView';
import { VaultView } from './components/VaultView';
import { SwarmFleetView } from './components/SwarmFleetView';
import { MessengerView } from './components/MessengerView';
import { DexMarketView } from './components/DexMarketView';
import { ManualView } from './components/ManualView';
import { IdentityKeyModal } from './components/IdentityKeyModal';
import { healAndResyncChunks } from './utils/chunkEngine';
import { evaluateNodeStatus } from './utils/storageManager';

export default function App() {
  const [activeTab, setActiveTab] = useState<'node' | 'vault' | 'fleet' | 'messenger' | 'dex' | 'manual'>('node');
  const [selectedDeviceType, setSelectedDeviceType] = useState<DeviceType>('android');
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

  const [files, setFiles] = useState<VaultFile[]>(() => {
    const saved = localStorage.getItem('nexxus_files');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_FILES;
  });

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
          treasury: {
            ...INITIAL_IDENTITY.treasury,
            ...(parsed.treasury || {}),
          },
          subscribedStorageGb: parsed.subscribedStorageGb ?? INITIAL_IDENTITY.subscribedStorageGb ?? 0,
          dailyStorageExpenseNexx: parsed.dailyStorageExpenseNexx ?? INITIAL_IDENTITY.dailyStorageExpenseNexx ?? 0,
        };
      } catch (e) { /* fallback */ }
    }
    return INITIAL_IDENTITY;
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('nexxus_messages');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_MESSAGES;
  });

  const [permissions, setPermissions] = useState<SystemPermissionItem[]>(INITIAL_PERMISSIONS);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  // Emergency Grace state (1 hour = 3600 seconds)
  const [graceNodeId, setGraceNodeId] = useState<string | null>(null);
  const [graceRemainingSeconds, setGraceRemainingSeconds] = useState<number | null>(null);
  const [selfHealingNotification, setSelfHealingNotification] = useState<string | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('nexxus_nodes', JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    localStorage.setItem('nexxus_files', JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem('nexxus_identity', JSON.stringify(identity));
  }, [identity]);

  useEffect(() => {
    localStorage.setItem('nexxus_messages', JSON.stringify(messages));
  }, [messages]);

  // Current primary node (matches selected device type)
  const currentNode = (selectedDeviceType === 'desktop_linux'
    ? nodes.find(n => n.deviceType === 'desktop_linux')
    : nodes.find(n => n.isCurrentDevice && n.deviceType === selectedDeviceType))
    || nodes.find(n => n.deviceType === selectedDeviceType)
    || nodes.find(n => n.isCurrentDevice)
    || nodes[0];

  // Total vault quota: 1/8 of online nodes + external + token subscription
  const totalVaultQuotaGb = nodes.reduce((sum, n) => sum + (n.isOnline ? (n.personalVaultQuotaGb || 0) : 0), 0) + (identity.subscribedStorageGb || 0);

  // 1-Hour Grace Period Timer
  useEffect(() => {
    if (!graceNodeId || graceRemainingSeconds === null) return;

    if (graceRemainingSeconds <= 0) {
      // Grace period expired! Trigger penalty and self-healing evacuation of 16KB chunks
      handleGracePeriodExpired(graceNodeId);
      return;
    }

    const timer = setInterval(() => {
      setGraceRemainingSeconds(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [graceNodeId, graceRemainingSeconds]);

  // Handle expiration of 1-hour grace period
  const handleGracePeriodExpired = (offlineId: string) => {
    const targetNode = nodes.find(n => n.id === offlineId);
    if (!targetNode) return;

    // Apply penalty: decrease reputation, reset 30-day streak
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

    // Self-healing: evacuate chunks of this offline node to highest ranking nodes!
    const { updatedFiles, reRoutedCount } = healAndResyncChunks(files, offlineId, nodes);

    setNodes(updatedNodes);
    setFiles(updatedFiles);
    setGraceNodeId(null);
    setGraceRemainingSeconds(null);

    setSelfHealingNotification(
      `⚠️ Льготный период 1 час истёк! Нода "${targetNode.name}" оштрафована (-150 репутации). Сработал протокол Self-Healing: ${reRoutedCount} чанков (по 16Кб) экстренно эвакуированы на ноды с высшим рейтингом!`
    );

    setTimeout(() => setSelfHealingNotification(null), 8000);
  };

  // Simulate Emergency Disconnect (Wi-Fi or power outage)
  const handleSimulateEmergencyGrace = (nodeId: string) => {
    const updated = nodes.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          isOnline: false,
          offlineSince: Date.now(),
          graceExpiresAt: Date.now() + 3600 * 1000, // 1 hour grace
        };
      }
      return n;
    });

    setNodes(updated);
    setGraceNodeId(nodeId);
    setGraceRemainingSeconds(3600); // 1 hour = 3600 seconds
  };

  // Restore node back to online before 1 hour ends
  const handleRestoreNode = (nodeId: string) => {
    const updated = nodes.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          isOnline: true,
          offlineSince: null,
          graceExpiresAt: null,
        };
      }
      return n;
    });

    setNodes(updated);
    if (graceNodeId === nodeId) {
      setGraceNodeId(null);
      setGraceRemainingSeconds(null);
    }
  };

  // Force expire grace immediately (test penalty & self-healing)
  const handleExpireGraceNow = (nodeId: string) => {
    handleGracePeriodExpired(nodeId);
  };

  // Update current node
  const handleUpdateCurrentNode = (updated: NodeRecord) => {
    setNodes(prev => prev.map(n => n.id === updated.id ? updated : n));
  };

  // Toggle permission
  const handleTogglePermission = (key: string) => {
    setPermissions(prev => prev.map(p => p.key === key ? { ...p, granted: !p.granted } : p));
  };

  // Add new vault file
  const handleAddFile = (newFile: VaultFile) => {
    setFiles(prev => [newFile, ...prev]);
  };

  // Send message in SMP messenger
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

    // Simulated reply from peer after 2.5 seconds
    setTimeout(() => {
      const replyMsg: ChatMessage = {
        id: `msg_reply_${Date.now()}`,
        senderId: 'contact_alice',
        senderName: 'Alice (Guardian #4)',
        senderOnion: 'alice4p8q1w4e7r0t2y5u8i1o4p7a0s3d6f9g2h5j8k1l4z7x0c.onion:9050',
        recipientId: 'current_user',
        text: attachment 
          ? `Получен xFTP поток чанков "${attachment.name}". 6× репликация (RF=6×) подтверждена локальной нодой!`
          : `Принято по протоколу SMP через onion hidden service. Задержка минимальная.`,
        timestamp: Date.now(),
        protocol: attachment ? 'xFTP' : 'SMP',
        isRelayedViaPrivateServer: true,
        status: 'delivered',
      };
      setMessages(prev => [...prev, replyMsg]);
    }, 2200);
  };

  // Toggle private server
  const handleTogglePrivateServer = () => {
    handleUpdateCurrentNode({
      ...currentNode,
      smpServerRunning: !currentNode.smpServerRunning,
    });
  };

  // Add new node to fleet
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

  // Balances & Storage Subscription update
  const handleUpdateIdentityBalances = (newBalances: Bip39Identity['balances'], extraStorageGb?: number) => {
    setIdentity(prev => ({
      ...prev,
      balances: newBalances,
      subscribedStorageGb: extraStorageGb ? prev.subscribedStorageGb + extraStorageGb : prev.subscribedStorageGb,
    }));
  };

  const offlineGraceNode = graceNodeId ? nodes.find(n => n.id === graceNodeId) || null : null;

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Self-Healing Notification Toast */}
      {selfHealingNotification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-lg bg-slate-900 border border-amber-500/50 p-4 rounded-2xl shadow-2xl text-xs text-amber-200 animate-slide-up flex items-start gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 mt-1 shrink-0 animate-ping" />
          <div className="leading-relaxed">
            {selfHealingNotification}
          </div>
        </div>
      )}

      {/* Persistent App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        nodes={nodes}
        identity={identity}
        selectedDeviceType={selectedDeviceType}
        setSelectedDeviceType={setSelectedDeviceType}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
        offlineGraceNode={offlineGraceNode}
        graceRemainingSeconds={graceRemainingSeconds}
        onRestoreNode={handleRestoreNode}
      />

      {/* Main Content Body */}
      <main className="flex-1 pb-16">
        {activeTab === 'node' && (
          <NodeDaemonView
            currentNode={currentNode}
            onUpdateCurrentNode={handleUpdateCurrentNode}
            permissions={permissions}
            onTogglePermission={handleTogglePermission}
            deviceType={selectedDeviceType}
          />
        )}

        {activeTab === 'vault' && (
          <VaultView
            files={files}
            onAddFile={handleAddFile}
            onUpdateFiles={setFiles}
            nodes={nodes}
            identity={identity}
            totalVaultQuotaGb={totalVaultQuotaGb}
            currentNode={currentNode}
          />
        )}

        {activeTab === 'fleet' && (
          <SwarmFleetView
            nodes={nodes}
            identity={identity}
            vaultFiles={files}
            onUpdateFiles={setFiles}
            onToggleNodeOnline={handleRestoreNode}
            onSimulateEmergencyGrace={handleSimulateEmergencyGrace}
            onExpireGraceNow={handleExpireGraceNow}
            onAddNewNode={handleAddNewNode}
            graceNodeId={graceNodeId}
            graceRemainingSeconds={graceRemainingSeconds}
          />
        )}

        {activeTab === 'messenger' && (
          <MessengerView
            messages={messages}
            onSendMessage={handleSendMessage}
            currentNode={currentNode}
            onTogglePrivateServer={handleTogglePrivateServer}
            identity={identity}
          />
        )}

        {activeTab === 'dex' && (
          <DexMarketView
            identity={identity}
            nodes={nodes}
            onUpdateIdentity={setIdentity}
            orders={INITIAL_ORDER_BOOK}
          />
        )}

        {activeTab === 'manual' && (
          <ManualView
            onNavigateTab={setActiveTab}
            onOpenBip39Modal={() => setIsKeyModalOpen(true)}
          />
        )}
      </main>

      {/* BIP-39 Key Inspection Modal */}
      <IdentityKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        identity={identity}
        onUpdateIdentity={setIdentity}
      />
    </div>
  );
}
