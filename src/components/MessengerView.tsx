import React, { useState } from 'react';
import { 
  MessageSquare, Send, Paperclip, Shield, Globe, Server, CheckCheck, 
  Lock, Radio, User, Plus, RefreshCw, FileText, ChevronRight, Activity, Terminal
} from 'lucide-react';
import { ChatMessage, NodeRecord, Bip39Identity } from '../types/nexxus';

interface MessengerViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, attachment?: { name: string; sizeBytes: number; chunksCount: number; fileId: string }) => void;
  currentNode: NodeRecord;
  onTogglePrivateServer: () => void;
  identity: Bip39Identity;
}

interface Contact {
  id: string;
  name: string;
  onionAddress: string;
  avatarColor: string;
  status: 'online' | 'relay_connected';
  lastSeen: string;
}

export const MessengerView: React.FC<MessengerViewProps> = ({
  messages,
  onSendMessage,
  currentNode,
  onTogglePrivateServer,
  identity,
}) => {
  const [selectedContactId, setSelectedContactId] = useState<string>('contact_alice');
  const [inputText, setInputText] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([
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
      name: 'Bob (Old Pixel Node)',
      onionAddress: 'bob3x98a1b2c3d4e5f60718293a4b5c6d7e8f90123456789a.onion:9050',
      avatarColor: 'bg-cyan-600',
      status: 'relay_connected',
      lastSeen: 'Подключен к вашему NeXXUs серверу',
    },
    {
      id: 'contact_cipher',
      name: 'Satoshi (Cold Swarm)',
      onionAddress: 'satoshi77a4b8c2d6e0f4g8h2i6j0k4l8m2n6o0p4q8r2s6t0u4.onion:9050',
      avatarColor: 'bg-purple-600',
      status: 'online',
      lastSeen: 'Маршрутизация через Tor v3',
    }
  ]);

  const activeContact = contacts.find(c => c.id === selectedContactId) || contacts[0];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleSendMockXftpFile = () => {
    const fileName = `secure_chunk_mesh_${Math.floor(Math.random() * 900 + 100)}.xftp`;
    onSendMessage(
      `Отправляю зашифрованный файл через xFTP (нарезка на 16Кб чанки по стандарту NeXXUs RF=6×):`,
      {
        name: fileName,
        sizeBytes: 96 * 1024,
        chunksCount: 6,
        fileId: `xftp_${Date.now()}`,
      }
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Top Banner: SMP / xFTP Onion Messenger Architecture */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-blue-950 border border-blue-500/30 text-blue-400 font-bold uppercase">
              SMP + xFTP Протоколы
            </span>
            <span className="text-xs text-slate-400 font-mono">Zero Metadata • Onion v3 Hidden Service</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight font-mono mt-1">
            P2P Защищенный Мессенджер
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Сообщения передаются по протоколу <strong className="text-blue-300 font-mono">SMP</strong> напрямую между .onion адресами нод. 
            Файлы передаются транспортом <strong className="text-cyan-300 font-mono">xFTP</strong> в виде 16Кб чанков.
          </p>
        </div>

        {/* Private NeXXUs Server Toggle */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-4 min-w-[280px]">
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <Server className="w-4 h-4 text-emerald-400" />
              Приватный NeXXUs Сервер
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {currentNode.smpServerRunning ? 'Работает на этой ноде' : 'Остановлен'}
            </div>
          </div>

          <button
            id="btn-toggle-private-server"
            onClick={onTogglePrivateServer}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              currentNode.smpServerRunning
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {currentNode.smpServerRunning ? 'ВКЛЮЧЕН' : 'ВКЛЮЧИТЬ'}
          </button>
        </div>
      </div>

      {/* Main Messenger Layout: Contacts + Chat Area */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        {/* Contacts Sidebar */}
        <div className="md:col-span-4 border-r border-slate-800/80 bg-slate-950/60 p-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Контакты в Сетке</span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                {contacts.length} Onion Peers
              </span>
            </div>

            <div className="space-y-1.5">
              {contacts.map(contact => (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContactId(contact.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center gap-3 ${
                    selectedContactId === contact.id
                      ? 'bg-slate-800/90 border-blue-500/40 text-white'
                      : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-850 text-slate-300'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl ${contact.avatarColor} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md`}>
                    {contact.name.charAt(0)}
                  </div>
                  <div className="overflow-hidden space-y-0.5 flex-1">
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span className="truncate">{contact.name}</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 truncate">
                      {contact.onionAddress}
                    </div>
                    <div className="text-[10px] text-blue-400">
                      {contact.lastSeen}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Node Owner Onion Identity at bottom */}
          <div className="pt-3 border-t border-slate-800/80 mt-4 text-xs">
            <span className="text-slate-400 block text-[11px] mb-1">Ваш адрес ноды в SMP:</span>
            <div className="font-mono text-[10px] text-emerald-400 truncate bg-slate-950 p-2 rounded-lg border border-slate-800">
              {currentNode.onionAddress}
            </div>
          </div>
        </div>

        {/* Chat Thread */}
        <div className="md:col-span-8 flex flex-col justify-between bg-slate-900/40">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${activeContact.avatarColor} flex items-center justify-center text-white font-bold text-xs`}>
                {activeContact.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>{activeContact.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/30">
                    SMP Direct P2P
                  </span>
                </h3>
                <p className="text-[11px] font-mono text-slate-400 truncate max-w-sm">
                  {activeContact.onionAddress}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">E2EE Onion Circuit</span>
            </div>
          </div>

          {/* Messages Area */}
          <div className="p-4 space-y-4 overflow-y-auto max-h-[420px]">
            {messages.map(msg => {
              const isMe = msg.senderId === 'current_user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="text-[10px] text-slate-500 font-mono mb-1 px-1">
                    {msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {msg.protocol}
                  </div>

                  <div
                    className={`max-w-lg p-3.5 rounded-2xl text-xs space-y-2 ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-950/50'
                        : 'bg-slate-850 border border-slate-750 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    <p className="leading-relaxed">{msg.text}</p>

                    {/* xFTP 16KB chunk file attachment */}
                    {msg.attachment && (
                      <div className="p-2.5 rounded-xl bg-black/30 border border-white/10 space-y-1 mt-2">
                        <div className="flex items-center gap-2 font-mono font-bold text-white text-[11px]">
                          <FileText className="w-4 h-4 text-cyan-300 shrink-0" />
                          <span className="truncate">{msg.attachment.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-cyan-200/90 font-mono pt-1 border-t border-white/10">
                          <span>{msg.attachment.chunksCount} чанков по 16Кб (RF=6×)</span>
                          <span>xFTP Swarm Stream</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono mt-1 px-1">
                    <CheckCheck className="w-3 h-3 text-emerald-400" />
                    <span>Доставлено через Tor Onion</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-800/80 bg-slate-950/60 flex items-center gap-2">
            <button
              type="button"
              onClick={handleSendMockXftpFile}
              title="Отправить файл через xFTP (16Кб чанки)"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition shrink-0 cursor-pointer"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Напишите сообщение по защищенному протоколу SMP..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />

            <button
              type="submit"
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition shrink-0 shadow-md shadow-blue-950/50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
