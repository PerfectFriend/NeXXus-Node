import React, { useRef, useEffect } from 'react';
import { 
  CheckCheck, Download, RefreshCw, FileText, 
  Play, Square, Mic 
} from 'lucide-react';
import { ChatMessage } from '../../types/nexxus';

export interface ChatThreadProps {
  messages: ChatMessage[];
  contactName: string;
  downloadingFileId: string | null;
  onDownloadAttachment: (attachment: {
    fileId: string;
    name: string;
    chunksCount: number;
    sizeBytes: number;
  }) => Promise<void>;
}

/**
 * ChatThread displays the scrollable message stream, rendering E2EE text messages,
 * xFTP chunked file attachments, and decrypted voice notes.
 *
 * @param {ChatThreadProps} props - Component properties and event handlers.
 * @returns {React.ReactElement} The rendered chat stream container.
 */
export const ChatThread: React.FC<ChatThreadProps> = ({
  messages,
  contactName,
  downloadingFileId,
  onDownloadAttachment,
}) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-slate-500 font-mono text-xs space-y-2">
          <span>История сообщений с {contactName} пуста.</span>
          <span>Все сообщения шифруются ChaCha20-Poly1305 и передаются по Tor v3.</span>
        </div>
      ) : (
        messages.map(msg => {
          const isMe = msg.senderId === 'current_user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
            >
              <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1 px-1">
                <span>{isMe ? 'Вы' : msg.senderName}</span>
                <span>•</span>
                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">{msg.protocol}</span>
              </div>

              <div
                className={`max-w-[85%] sm:max-w-md p-3 sm:p-3.5 rounded-2xl text-xs font-mono leading-relaxed shadow-lg ${
                  isMe
                    ? 'bg-gradient-to-tr from-cyan-950/80 to-slate-900 border border-cyan-500/30 text-cyan-100 rounded-tr-none'
                    : 'bg-slate-900/95 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                {/* Text Content */}
                <p className="whitespace-pre-wrap break-words">{msg.text}</p>

                {/* xFTP File Attachment Card */}
                {msg.attachment && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-white font-bold truncate text-[11px]">
                          {msg.attachment.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {(msg.attachment.sizeBytes / 1024).toFixed(1)} KB • {msg.attachment.chunksCount} чанков (RF=6×)
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={downloadingFileId === msg.attachment.fileId}
                      onClick={() => onDownloadAttachment(msg.attachment!)}
                      className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white text-[11px] font-bold transition flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {downloadingFileId === msg.attachment.fileId ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span className="hidden sm:inline">Сборка...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Скачать</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Message Status */}
                <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-400">
                  {msg.isRelayedViaPrivateServer && (
                    <span className="text-emerald-400">Onion Relay</span>
                  )}
                  <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />
                </div>
              </div>
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
