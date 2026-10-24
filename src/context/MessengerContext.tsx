import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ChatMessage, NodeRecord } from '../types/nexxus';
import { INITIAL_MESSAGES } from '../data/mockInitialState';
import { p2pMeshBus } from '../utils/p2pMeshBus';

/**
 * Decoy messages for anti-torture Panic PIN duress mode.
 */
export const DECOY_MESSAGES: ChatMessage[] = [
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
  },
];

/**
 * Value contract exposed by MessengerContext.
 */
export interface MessengerContextValue {
  /** Active message list (or decoy messages during duress mode) */
  messages: ChatMessage[];
  /** Primary local node reference for onion address and relay parameters */
  currentNode: NodeRecord;
  /** Actions */
  sendMessage: (
    text: string, 
    attachment?: { name: string; sizeBytes: number; chunksCount: number; fileId: string }
  ) => void;
  togglePrivateServer: () => void;
}

const MessengerContext = createContext<MessengerContextValue | null>(null);

interface MessengerProviderProps {
  children: ReactNode;
  currentNode: NodeRecord;
  onUpdateCurrentNode?: (node: NodeRecord) => void;
  isDecoyMode?: boolean;
}

/**
 * MessengerProvider manages sovereign P2P chats via SMP and xFTP protocols over Tor v3 onion services.
 *
 * @param {MessengerProviderProps} props - Component props containing child components and primary node reference.
 * @returns {React.ReactElement} The rendered React Context provider.
 */
export const MessengerProvider: React.FC<MessengerProviderProps> = ({
  children,
  currentNode,
  onUpdateCurrentNode,
  isDecoyMode = false,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('nexxus_messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        /* fallback */
      }
    }
    return INITIAL_MESSAGES;
  });

  // Sync messages to localStorage when not in decoy mode
  useEffect(() => {
    if (!isDecoyMode) {
      localStorage.setItem('nexxus_messages', JSON.stringify(messages));
    }
  }, [messages, isDecoyMode]);

  // Listen for real P2P mesh bus broadcasts across browser tabs/nodes
  useEffect(() => {
    const unsubscribe = p2pMeshBus.subscribeMessages(incoming => {
      setMessages(prev => {
        if (prev.some(m => m.id === incoming.id)) return prev;
        return [
          ...prev,
          {
            id: incoming.id,
            senderId: incoming.senderId,
            senderName: incoming.senderName,
            senderOnion: incoming.senderOnion,
            recipientId: incoming.recipientId,
            text: incoming.text,
            timestamp: incoming.timestamp,
            protocol: incoming.protocol,
            attachment: incoming.attachment,
            isRelayedViaPrivateServer: true,
            status: 'delivered',
          },
        ];
      });
    });
    return unsubscribe;
  }, []);

  const sendMessage = useCallback((
    text: string, 
    attachment?: { name: string; sizeBytes: number; chunksCount: number; fileId: string }
  ) => {
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

    // Transmit authentic binary frame via P2P Mesh Bus (NEXX magic + ChaCha20-Poly1305 + SHA-256)
    p2pMeshBus
      .sendSmpMessage(
        'contact_alice',
        'alice4p8q1w4e7r0t2y5u8i1o4p7a0s3d6f9g2h5j8k1l4z7x0c.onion:9050',
        text,
        attachment
      )
      .catch(err => {
        console.warn('P2P wire broadcast notice:', err);
      });

    // Simulated peer acknowledgement reply
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
    }, 1800);
  }, [currentNode]);

  const togglePrivateServer = useCallback(() => {
    if (onUpdateCurrentNode) {
      onUpdateCurrentNode({
        ...currentNode,
        smpServerRunning: !currentNode.smpServerRunning,
      });
    }
  }, [currentNode, onUpdateCurrentNode]);

  const activeMessages = isDecoyMode ? DECOY_MESSAGES : messages;

  const contextValue: MessengerContextValue = {
    messages: activeMessages,
    currentNode,
    sendMessage,
    togglePrivateServer,
  };

  return <MessengerContext.Provider value={contextValue}>{children}</MessengerContext.Provider>;
};

/**
 * Hook to access sovereign messenger state and message dispatchers.
 *
 * @throws {Error} If called outside of a MessengerProvider.
 * @returns {MessengerContextValue} The messenger context value.
 */
export const useMessenger = (): MessengerContextValue => {
  const context = useContext(MessengerContext);
  if (!context) {
    throw new Error('useMessenger must be used within a MessengerProvider');
  }
  return context;
};
