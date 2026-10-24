import React, { useState } from 'react';
import { 
  ArrowLeft, Shield, Globe, Server, CheckCheck, 
  Terminal, Lock 
} from 'lucide-react';
import { ChatMessage, NodeRecord, Bip39Identity, VaultFile } from '../types/nexxus';
import { NavigationDrawer } from './messenger/NavigationDrawer';
import { ContactSidebar, ContactItem } from './messenger/ContactSidebar';
import { ChatThread } from './messenger/ChatThread';
import { MessageComposer } from './messenger/MessageComposer';
import { PersonalVaultFileManager } from './PersonalVaultFileManager';
import { ContactManagerModal } from './ContactManagerModal';
import { NetworkSettingsModal } from './NetworkSettingsModal';
import { useAttachmentDownloader } from '../hooks/useAttachmentDownloader';

export interface MessengerViewProps {
  messages: ChatMessage[];
  onSendMessage: (
    text: string, 
    attachment?: { name: string; sizeBytes: number; chunksCount: number; fileId: string }
  ) => void;
  currentNode: NodeRecord;
  onTogglePrivateServer: () => void;
  identity: Bip39Identity;
  files: VaultFile[];
  onAddFile: (file: VaultFile) => void;
  onDeleteFile?: (fileId: string) => void;
  nodes: NodeRecord[];
  personalSectionsCount: number;
  personalVaultQuotaGb: number;
  onOpenDrawerTab: (
    tab: 'sections' | 'fleet' | 'appstore' | 'dex' | 'security' | 'manual' | 'splash' | 'health'
  ) => void;
  onQuickLock: () => void;
  onSwitchAccount?: () => void;
  isDecoyMode?: boolean;
}

const INITIAL_CONTACTS: ContactItem[] = [
  {
    id: 'vault_favorites',
    name: '⭐️ Избранное (Хранилище)',
    isVault: true,
    onionAddress: 'Зашифрованный анклав (RF=6×)',
    avatarColor: 'from-amber-400 to-amber-600',
    status: 'encrypted_vault',
    lastSeen: 'Локально',
  },
  {
    id: 'contact_alice',
    name: 'Alice (Guardian #4)',
    onionAddress: 'alice4p8q1w4e7r0t2y5u8i1o4p7a0s3d6f9g2h5j8k1l4z7x0c.onion:9050',
    avatarColor: 'from-emerald-400 to-cyan-500',
    status: 'online',
    lastSeen: 'Сейчас в сети',
  },
  {
    id: 'contact_bob',
    name: 'Bob (Desktop Station)',
    onionAddress: 'bob7y2u5i8o1p4a7s0d3f6g9h2j5k8l1z4x7c0v3b6n9m2q5.onion:9050',
    avatarColor: 'from-blue-400 to-indigo-500',
    status: 'online',
    lastSeen: '5 мин назад',
  },
  {
    id: 'contact_charlie',
    name: 'Charlie (Archive Node)',
    onionAddress: 'charlie9z8x7c6v5b4n3m2l1k0j9h8g7f6d5s4a3p2o1i0u.onion:9050',
    avatarColor: 'from-purple-400 to-pink-500',
    status: 'relay_connected',
    lastSeen: '1 час назад',
  },
];

/**
 * MessengerView coordinates the full encrypted messaging experience,
 * personal vault file management, Tor Onion v3 indicators, and slide-over navigation.
 *
 * @param {MessengerViewProps} props - Component properties and global handlers.
 * @returns {React.ReactElement} The rendered sovereign messenger view.
 */
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
  onSwitchAccount,
  isDecoyMode = false,
}) => {
  const [selectedId, setSelectedId] = useState<string>('contact_alice');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeContactsList, setActiveContactsList] = useState<ContactItem[]>(INITIAL_CONTACTS);

  const { downloadingFileId, downloadAttachment } = useAttachmentDownloader();

  const handleAddNewContact = (newContact: { name: string; onionAddress: string }) => {
    const contactItem: ContactItem = {
      id: `contact_${Date.now()}`,
      name: newContact.name,
      onionAddress: newContact.onionAddress,
      avatarColor: 'from-cyan-400 to-emerald-500',
      status: 'online',
      lastSeen: 'Только что добавлен',
    };
    setActiveContactsList(prev => [...prev, contactItem]);
    setSelectedId(contactItem.id);
  };

  const filteredContacts = activeContactsList.filter(
    c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.onionAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeContact = activeContactsList.find(c => c.id === selectedId);

  // Storage metric calculation
  const totalUsedBytes = files.reduce((sum, f) => sum + f.sizeBytes, 0);
  const totalUsedGb = totalUsedBytes / (1024 * 1024 * 1024);

  return (
    <div className="h-screen flex flex-col bg-[#0b0f17] text-slate-100 overflow-hidden select-none">
      {/* 1. Slide-over Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        identity={identity}
        onSelectFavorites={() => setSelectedId('vault_favorites')}
        onOpenDrawerTab={onOpenDrawerTab}
        onOpenNetworkModal={() => setIsNetworkModalOpen(true)}
        onOpenContactModal={() => setIsContactModalOpen(true)}
        onQuickLock={onQuickLock}
        onSwitchAccount={onSwitchAccount}
      />

      {/* 2. Main Content Split: Contacts Sidebar + Active Chat/Vault Stage */}
      <div className="flex-1 flex overflow-hidden">
        {/* Contact Sidebar */}
        <ContactSidebar
          contacts={filteredContacts}
          selectedId={selectedId}
          searchQuery={searchQuery}
          totalUsedGb={totalUsedGb}
          personalVaultQuotaGb={personalVaultQuotaGb}
          onSelectContact={setSelectedId}
          onSearchChange={setSearchQuery}
          onOpenDrawer={() => setIsDrawerOpen(true)}
          onOpenContactModal={() => setIsContactModalOpen(true)}
        />

        {/* Right Stage: Active Chat or Personal Vault File Manager */}
        <div className="flex-1 flex flex-col bg-[#0b0f17] overflow-hidden min-w-0">
          {selectedId === 'vault_favorites' ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <PersonalVaultFileManager
                files={files}
                onAddFile={onAddFile}
                onDeleteFile={onDeleteFile}
                nodes={nodes}
                personalSectionsCount={personalSectionsCount}
                personalVaultQuotaGb={personalVaultQuotaGb}
                isDecoyMode={isDecoyMode}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Chat Header Bar */}
              <div className="p-3 sm:p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${
                      activeContact?.avatarColor || 'from-emerald-400 to-cyan-500'
                    } flex items-center justify-center text-slate-950 font-bold font-mono text-xs shadow-md shrink-0`}
                  >
                    {activeContact?.name.slice(0, 2).toUpperCase() || 'P2'}
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-sm font-bold font-mono text-white truncate">
                      {activeContact?.name || 'Собеседник'}
                    </h2>
                    <div className="text-[10px] font-mono text-emerald-400 truncate flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Tor Onion v3 • E2EE ChaCha20</span>
                    </div>
                  </div>
                </div>

                {/* Tor Private Server Relay Toggle */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={onTogglePrivateServer}
                    className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      currentNode.smpServerRunning
                        ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                    title="Локальный сервер SMP / xFTP через Onion v3"
                  >
                    <Server className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">
                      {currentNode.smpServerRunning ? 'SMP Relay: ВКЛ' : 'SMP Relay: ВЫКЛ'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={onQuickLock}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-300 transition cursor-pointer"
                    title="Заблокировать приложение"
                  >
                    <Lock className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Thread Messages */}
              <ChatThread
                messages={messages}
                contactName={activeContact?.name || 'Собеседник'}
                downloadingFileId={downloadingFileId}
                onDownloadAttachment={downloadAttachment}
              />

              {/* Message Composer */}
              <MessageComposer
                nodes={nodes}
                onSendMessage={onSendMessage}
              />
            </div>
          )}
        </div>
      </div>

      {/* 3. Sub-Modals */}
      <ContactManagerModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        identity={identity}
        onionAddress={currentNode.onionAddress}
        onAddContact={handleAddNewContact}
      />

      <NetworkSettingsModal
        isOpen={isNetworkModalOpen}
        onClose={() => setIsNetworkModalOpen(false)}
        onionAddress={currentNode.onionAddress}
      />
    </div>
  );
};
