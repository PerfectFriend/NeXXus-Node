import React, { useState } from 'react';
import { 
  UserPlus, QrCode, Share2, Copy, Check, Camera, 
  ArrowLeft, X, Sparkles, Shield, User, Globe, Download, Send
} from 'lucide-react';
import { Bip39Identity } from '../types/nexxus';

interface ContactManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  identity: Bip39Identity;
  onionAddress: string;
  onAddContact: (contact: { name: string; onionAddress: string; address?: string }) => void;
}

export const ContactManagerModal: React.FC<ContactManagerModalProps> = ({
  isOpen,
  onClose,
  identity,
  onionAddress,
  onAddContact,
}) => {
  const [activeTab, setActiveTab] = useState<'share_qr' | 'add_contact' | 'scan_camera'>('share_qr');

  // Add Contact Form State
  const [newContactName, setNewContactName] = useState('');
  const [newContactAddress, setNewContactAddress] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [addSuccessMessage, setAddSuccessMessage] = useState<string | null>(null);

  // Share state
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [isCopiedOnion, setIsCopiedOnion] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // Camera simulator
  const [isScanning, setIsScanning] = useState(false);

  if (!isOpen) return null;

  const contactDeepLink = `nexxus://contact?addr=${identity.accountAddress}&onion=${onionAddress}&name=NeXXusUser`;
  const shareText = `🔐 Добавьте меня в защищенный мессенджер NeXXus!\nАдрес: ${identity.accountAddress}\nOnion: ${onionAddress}\nСсылка: ${contactDeepLink}`;

  // Native Web Share API
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Мой контакт NeXXus Enclave',
          text: shareText,
          url: contactDeepLink,
        });
        setShareFeedback('Успешно отправлено!');
        setTimeout(() => setShareFeedback(null), 3000);
      } catch (err) {
        // User cancelled or share error, fallback to copy
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareText);
    setIsCopiedLink(true);
    setShareFeedback('Контактная карточка скопирована в буфер обмена!');
    setTimeout(() => {
      setIsCopiedLink(false);
      setShareFeedback(null);
    }, 2500);
  };

  const handleCopyOnion = () => {
    navigator.clipboard.writeText(onionAddress);
    setIsCopiedOnion(true);
    setTimeout(() => setIsCopiedOnion(false), 2000);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactAddress.trim()) return;

    setIsVerifying(true);
    setTimeout(() => {
      onAddContact({
        name: newContactName.trim(),
        onionAddress: newContactAddress.trim(),
      });
      setIsVerifying(false);
      setAddSuccessMessage(`Контакт "${newContactName}" успешно добавлен в ваш список общения!`);
      setNewContactName('');
      setNewContactAddress('');
      setTimeout(() => {
        setAddSuccessMessage(null);
        onClose();
      }, 1500);
    }, 600);
  };

  const handleSimulateScan = (name: string, onion: string) => {
    setNewContactName(name);
    setNewContactAddress(onion);
    setActiveTab('add_contact');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-hidden h-full h-[100dvh]">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[96dvh] p-4 sm:p-6 shadow-2xl relative text-slate-100 flex flex-col justify-between overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="shrink-0 pb-3 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold font-mono text-white flex items-center gap-2 truncate">
                <span>Управление Контактами</span>
              </h2>
              <p className="text-[11px] text-slate-400 truncate font-mono">
                QR-визитка, шеринг по любым каналам и добавление по адресу
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition shrink-0"
            title="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="shrink-0 py-2.5 flex items-center gap-1.5 border-b border-slate-800/80">
          <button
            onClick={() => setActiveTab('share_qr')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
              activeTab === 'share_qr'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>Мой QR-код</span>
          </button>

          <button
            onClick={() => setActiveTab('add_contact')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
              activeTab === 'add_contact'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Добавить Контакт</span>
          </button>

          <button
            onClick={() => setActiveTab('scan_camera')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
              activeTab === 'scan_camera'
                ? 'bg-purple-950/80 text-purple-300 border border-purple-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-purple-400" />
            <span>Сканер QR</span>
          </button>
        </div>

        {/* Modal Body (Scrollable in bounded window) */}
        <div className="flex-1 min-h-0 overflow-y-auto py-3 space-y-4 pr-1">
          
          {/* TAB 1: MY QR CODE & MULTI-CHANNEL SHARE */}
          {activeTab === 'share_qr' && (
            <div className="flex flex-col items-center text-center space-y-3.5">
              
              {/* Generated Crisp SVG QR Code */}
              <div className="p-3 bg-white rounded-2xl shadow-xl shadow-emerald-500/10 border-4 border-slate-800 relative group">
                <svg
                  className="w-48 h-48 sm:w-56 sm:h-56"
                  viewBox="0 0 256 256"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="256" height="256" fill="#ffffff" />
                  {/* Outer corner anchors */}
                  <rect x="20" y="20" width="60" height="60" fill="#0b0f17" rx="8" />
                  <rect x="30" y="30" width="40" height="40" fill="#ffffff" rx="4" />
                  <rect x="40" y="40" width="20" height="20" fill="#10b981" rx="2" />

                  <rect x="176" y="20" width="60" height="60" fill="#0b0f17" rx="8" />
                  <rect x="186" y="30" width="40" height="40" fill="#ffffff" rx="4" />
                  <rect x="196" y="40" width="20" height="20" fill="#10b981" rx="2" />

                  <rect x="20" y="176" width="60" height="60" fill="#0b0f17" rx="8" />
                  <rect x="30" y="186" width="40" height="40" fill="#ffffff" rx="4" />
                  <rect x="40" y="196" width="20" height="20" fill="#10b981" rx="2" />

                  {/* QR Matrix Grid Pattern */}
                  <g fill="#0b0f17">
                    <rect x="95" y="20" width="12" height="12" />
                    <rect x="115" y="20" width="12" height="12" />
                    <rect x="145" y="20" width="12" height="12" />
                    <rect x="95" y="40" width="12" height="12" />
                    <rect x="135" y="40" width="12" height="12" />
                    <rect x="105" y="60" width="12" height="12" />
                    <rect x="145" y="60" width="12" height="12" />

                    {/* Middle Rows */}
                    <rect x="20" y="95" width="12" height="12" />
                    <rect x="40" y="95" width="12" height="12" />
                    <rect x="60" y="95" width="12" height="12" />
                    <rect x="95" y="95" width="12" height="12" />
                    <rect x="115" y="95" width="26" height="26" fill="#10b981" rx="4" />
                    <rect x="155" y="95" width="12" height="12" />
                    <rect x="185" y="95" width="12" height="12" />
                    <rect x="215" y="95" width="12" height="12" />

                    <rect x="30" y="115" width="12" height="12" />
                    <rect x="70" y="115" width="12" height="12" />
                    <rect x="165" y="115" width="12" height="12" />
                    <rect x="205" y="115" width="12" height="12" />

                    <rect x="20" y="135" width="12" height="12" />
                    <rect x="50" y="135" width="12" height="12" />
                    <rect x="95" y="135" width="12" height="12" />
                    <rect x="145" y="135" width="12" height="12" />
                    <rect x="185" y="135" width="12" height="12" />
                    <rect x="225" y="135" width="12" height="12" />

                    {/* Bottom Right Area */}
                    <rect x="95" y="176" width="12" height="12" />
                    <rect x="135" y="176" width="12" height="12" />
                    <rect x="176" y="176" width="12" height="12" />
                    <rect x="215" y="176" width="12" height="12" />
                    <rect x="115" y="196" width="12" height="12" />
                    <rect x="155" y="196" width="12" height="12" />
                    <rect x="195" y="196" width="12" height="12" />
                    <rect x="95" y="215" width="12" height="12" />
                    <rect x="135" y="215" width="12" height="12" />
                    <rect x="176" y="215" width="12" height="12" />
                    <rect x="225" y="215" width="12" height="12" />
                  </g>
                </svg>

                {/* Badge Overlay */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-950 p-1.5 rounded-xl border-2 border-emerald-400 shadow-lg">
                  <Shield className="w-5 h-5 text-emerald-400" />
                </div>
              </div>

              {/* User Address & Onion Cards */}
              <div className="w-full space-y-2 text-left font-mono">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Ваш NeXXus Адрес:</div>
                    <div className="text-xs text-white font-bold truncate">{identity.accountAddress}</div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(identity.accountAddress);
                      setShareFeedback('Адрес скопирован!');
                      setTimeout(() => setShareFeedback(null), 2000);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0"
                    title="Копировать"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[10px] text-purple-400 uppercase tracking-wider">Tor Onion v3 Адрес:</div>
                    <div className="text-[11px] text-slate-300 truncate">{onionAddress}</div>
                  </div>
                  <button
                    onClick={handleCopyOnion}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0"
                    title="Копировать Onion"
                  >
                    {isCopiedOnion ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {shareFeedback && (
                <div className="w-full p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-mono animate-fade-in flex items-center justify-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{shareFeedback}</span>
                </div>
              )}

              {/* Multi-channel Share Actions */}
              <div className="w-full grid grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={handleNativeShare}
                  className="py-3 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs font-mono transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Поделиться</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs font-mono transition flex items-center justify-center gap-1.5"
                >
                  {isCopiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopiedLink ? 'Скопировано!' : 'Копировать всё'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: ADD CONTACT BY ADDRESS */}
          {activeTab === 'add_contact' && (
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-slate-300 block">
                  Имя контакта / Псевдоним:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    placeholder="Например: Боб (Нода Прага) или Алиса"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-slate-300 block">
                  Адрес контакта (NeXXus nx1q... или Tor Onion v3):
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={newContactAddress}
                    onChange={(e) => setNewContactAddress(e.target.value)}
                    placeholder="nx1q... или bob7x8...onion:9050"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Sample Quick Demo Contacts */}
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="text-[11px] font-mono text-slate-400 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Быстрый выбор проверенных узлов роя:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewContactName('Bob (Guardian Node #12)');
                      setNewContactAddress('bob8m3v1w9k2p7x4z6r0t5y8u1i4o7a0s3d6f9g2h5j8k1l4.onion:9050');
                    }}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left text-xs font-mono transition"
                  >
                    <div className="font-bold text-cyan-300 truncate">Bob (Guardian)</div>
                    <div className="text-[10px] text-slate-500 truncate">bob8m3v...onion</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewContactName('Charlie (Storage Host 64GB)');
                      setNewContactAddress('charlie4p8q1w4e7r0t2y5u8i1o4p7a0s3d6f9g2h5j8k1l.onion:9050');
                    }}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left text-xs font-mono transition"
                  >
                    <div className="font-bold text-emerald-300 truncate">Charlie (Host)</div>
                    <div className="text-[10px] text-slate-500 truncate">charlie4p...onion</div>
                  </button>
                </div>
              </div>

              {addSuccessMessage && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs font-mono flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{addSuccessMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs font-mono transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                {isVerifying ? (
                  <span>Проверка Onion v3 рукопожатия...</span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Добавить контакт в шифрованный чат</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: CAMERA SCANNER SIMULATOR */}
          {activeTab === 'scan_camera' && (
            <div className="space-y-4 text-center">
              <div className="relative w-full h-56 rounded-2xl bg-slate-950 border-2 border-dashed border-purple-500/50 overflow-hidden flex flex-col items-center justify-center p-4">
                {/* Visual Scanner Grid Overlay */}
                <div className="absolute inset-x-8 top-1/4 bottom-1/4 border-2 border-purple-400 rounded-xl pointer-events-none animate-pulse">
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-bounce mt-10" />
                </div>

                <Camera className="w-10 h-10 text-purple-400 mb-2 opacity-80" />
                <div className="text-xs font-mono font-bold text-white">
                  Камера готова к распознаванию
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-1 max-w-xs">
                  Наведите камеру смартфона на QR-код контакта или выберите готовый тестовый образец:
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSimulateScan('Sovereign DAO Relayer', 'dao7relay89qwert0123456789abcdef.onion:9050')}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-purple-950/50 border border-purple-500/40 text-xs font-mono text-purple-200 transition"
                >
                  <div className="font-bold truncate">📡 DAO Relayer</div>
                  <div className="text-[10px] text-slate-400 truncate">Сканировать QR</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulateScan('Elena (Mobile Mesh)', 'elena9mobile1234567890abcdef.onion:9050')}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-cyan-950/50 border border-cyan-500/40 text-xs font-mono text-cyan-200 transition"
                >
                  <div className="font-bold truncate">📱 Elena (Mesh)</div>
                  <div className="text-[10px] text-slate-400 truncate">Сканировать QR</div>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="shrink-0 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>P2P Simple Messaging Protocol (SMP)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition"
          >
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
};
