import React, { useState, useRef } from 'react';
import { 
  Paperclip, Send, Mic, MicOff, Square, RefreshCw, X 
} from 'lucide-react';
import { NodeRecord } from '../../types/nexxus';
import { sliceFileInto16KbChunks } from '../../utils/chunkEngine';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';

export interface MessageComposerProps {
  nodes: NodeRecord[];
  onSendMessage: (
    text: string, 
    attachment?: { name: string; sizeBytes: number; chunksCount: number; fileId: string }
  ) => void;
}

/**
 * MessageComposer provides the bottom input bar allowing text messages,
 * client-side 16 KB file slicing for xFTP peer transmission, and voice notes.
 *
 * @param {MessageComposerProps} props - Component properties and event handlers.
 * @returns {React.ReactElement} The rendered message composer bar.
 */
export const MessageComposer: React.FC<MessageComposerProps> = ({
  nodes,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState<{
    file: File;
    name: string;
    sizeBytes: number;
  } | null>(null);
  const [isSlicingAttachment, setIsSlicingAttachment] = useState(false);
  const [composerStatus, setComposerStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { isRecordingVoice, recordingSeconds, toggleVoiceRecording } = useVoiceRecorder();

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setComposerStatus('Лимит на размер вложения через Onion v3 составляет 25 MB.');
      setTimeout(() => setComposerStatus(null), 3500);
      return;
    }

    setPendingAttachment({
      file,
      name: file.name,
      sizeBytes: file.size,
    });
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() && !pendingAttachment) return;

    let attachmentPayload: { name: string; sizeBytes: number; chunksCount: number; fileId: string } | undefined = undefined;

    if (pendingAttachment) {
      setIsSlicingAttachment(true);
      setComposerStatus(`Нарезка "${pendingAttachment.name}" на 16KB чанки (ChaCha20-Poly1305)...`);
      try {
        const fileId = `chat_attach_${Date.now()}`;
        const chunks = await sliceFileInto16KbChunks(pendingAttachment.file, fileId, nodes, 'hot_rf6');
        attachmentPayload = {
          name: pendingAttachment.name,
          sizeBytes: pendingAttachment.sizeBytes,
          chunksCount: chunks.length,
          fileId,
        };
      } catch (err) {
        console.error('Failed to slice chat attachment', err);
        setComposerStatus('Ошибка нарезки чанков вложения');
        setIsSlicingAttachment(false);
        return;
      }
      setIsSlicingAttachment(false);
      setPendingAttachment(null);
    }

    onSendMessage(inputText.trim(), attachmentPayload);
    setInputText('');
    setComposerStatus(null);
  };

  const handleToggleVoice = () => {
    toggleVoiceRecording(
      async (audioBlob, durationSec) => {
        const durationText = durationSec > 0 ? `${durationSec} сек` : '1 сек';
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        const fileId = `voice_${Date.now()}`;
        const chunks = await sliceFileInto16KbChunks(audioFile, fileId, nodes, 'hot_rf6');

        onSendMessage(
          `🎙️ Голосовое сообщение (${durationText}) [E2EE ChaCha20-Poly1305]:`,
          {
            name: audioFile.name,
            sizeBytes: audioFile.size,
            chunksCount: chunks.length,
            fileId,
          }
        );
      },
      errMessage => {
        setComposerStatus(errMessage);
        setTimeout(() => setComposerStatus(null), 3500);
      }
    );
  };

  return (
    <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 space-y-2 shrink-0">
      {/* Pending attachment or slicing notice */}
      {pendingAttachment && (
        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono text-cyan-300">
          <div className="flex items-center gap-2 truncate">
            <span className="font-bold truncate">{pendingAttachment.name}</span>
            <span className="text-slate-500">({(pendingAttachment.sizeBytes / 1024).toFixed(1)} KB)</span>
          </div>
          <button
            type="button"
            onClick={() => setPendingAttachment(null)}
            className="p-1 hover:text-white text-slate-400 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {composerStatus && (
        <div className="text-[11px] font-mono text-amber-300 flex items-center gap-1.5 animate-pulse">
          <span>{composerStatus}</span>
        </div>
      )}

      {/* Input controls form */}
      <form onSubmit={handleSend} className="flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleSelectFile}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSlicingAttachment}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          title="Прикрепить файл (xFTP 16KB Chunks)"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleToggleVoice}
          className={`p-2.5 rounded-xl transition cursor-pointer ${
            isRecordingVoice
              ? 'bg-red-600 text-white animate-pulse'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
          }`}
          title={isRecordingVoice ? 'Остановить запись' : 'Записать голосовое сообщение'}
        >
          {isRecordingVoice ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {isRecordingVoice ? (
          <div className="flex-1 px-4 py-2 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>Запись голосового сообщения: {recordingSeconds} сек...</span>
          </div>
        ) : (
          <input
            type="text"
            placeholder="Сообщение через Onion v3 (SMP / ChaCha20)..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            disabled={isSlicingAttachment}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
          />
        )}

        <button
          type="submit"
          disabled={isSlicingAttachment || (!inputText.trim() && !pendingAttachment)}
          className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 disabled:opacity-40 text-white transition shadow-md cursor-pointer"
        >
          {isSlicingAttachment ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
};
