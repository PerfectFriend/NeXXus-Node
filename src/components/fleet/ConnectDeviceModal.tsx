import React, { useState, useEffect } from 'react';
import { 
  Plus, X, Copy, Check, QrCode, Smartphone, Laptop 
} from 'lucide-react';
import { NodeRecord, DeviceType } from '../../types/nexxus';
import { generateQrDataUrl } from '../../utils/qrCodeService';
import { secureRandomInt } from '../../utils/cryptoRandom';

export interface ConnectDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterPublicKey: string;
  onAddNewNode: (newNode: Partial<NodeRecord>) => void;
}

/**
 * ConnectDeviceModal provides the pairing interface to connect new Android devices,
 * Ubuntu servers, and desktop daemons into the BIP-39 swarm via QR or Onion URI.
 *
 * @param {ConnectDeviceModalProps} props - Component properties and callbacks.
 * @returns {React.ReactElement | null} The modal element, or null if closed.
 */
export const ConnectDeviceModal: React.FC<ConnectDeviceModalProps> = ({
  isOpen,
  onClose,
  masterPublicKey,
  onAddNewNode,
}) => {
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeType, setNewNodeType] = useState<DeviceType>('android');
  const [newNodeStorageGb, setNewNodeStorageGb] = useState<number>(64);
  const [copiedPairing, setCopiedPairing] = useState(false);
  const [pairingQrUrl, setPairingQrUrl] = useState<string>('');

  const pairingUri = `nexxus://pair?key=${masterPublicKey.slice(0, 32)}&net=onion`;

  useEffect(() => {
    if (!isOpen) return;
    generateQrDataUrl(pairingUri, { width: 200, margin: 1, darkColor: '#090d16', lightColor: '#ffffff' })
      .then(url => setPairingQrUrl(url))
      .catch(() => {});
  }, [isOpen, pairingUri]);

  if (!isOpen) return null;

  const handleCreateNodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeName.trim()) return;

    const reserved16Gb = Math.floor(newNodeStorageGb / 16);
    const totalAllocated = reserved16Gb * 16;
    const personalQuota = totalAllocated / 8;

    const chars = 'abcdefghijklmnopqrstuvwxyz234567';
    let randOnion = 'nexxus';
    for (let i = 0; i < 48; i++) randOnion += chars[secureRandomInt(chars.length)];

    const randomAsns = [
      { asn: 'AS9009', isp: 'M247 Global Network' },
      { asn: 'AS15169', isp: 'Google Fiber Direct' },
      { asn: 'AS3301', isp: 'Telia Company AB' },
      { asn: 'AS2516', isp: 'KDDI Corporation Japan' },
      { asn: 'AS1273', isp: 'Vodafone Backbone' },
    ];
    const pickedAsn = randomAsns[secureRandomInt(randomAsns.length)];

    onAddNewNode({
      name: newNodeName.trim(),
      deviceType: newNodeType,
      model: newNodeType === 'android' ? 'Android Device (Node)' : 'Desktop Station',
      isOnline: true,
      isCurrentDevice: false,
      onionAddress: `${randOnion.slice(0, 56)}.onion:9050`,
      v2rayActive: true,
      torActive: true,
      smpServerRunning: false,
      xFTPRelayRunning: true,
      batteryLevel: 100,
      isCharging: true,
      temperatureC: 33.5,
      wifiSsid: 'Home_Decentralized_Mesh',
      wifiSignalDbm: -52,
      asn: pickedAsn.asn,
      isp: pickedAsn.isp,
      internalTotalGb: newNodeStorageGb,
      internalFreeGb: newNodeStorageGb - 8,
      autoModeEnabled: true,
      reservedSections16Gb: reserved16Gb,
      totalStorageAllocatedGb: totalAllocated,
      personalVaultQuotaGb: personalQuota,
      personalVaultUsedGb: 0.1,
      reputationScore: 400,
      reputationTier: 'Reliable Node (301-600)',
      consecutiveDaysWithoutPenalty: 0,
      penaltiesCount: 0,
      storedChunksCount: 1200,
      replicatedChunksServed: 400,
      bandwidthSharedMb: 120.0,
      externalDevices: [],
    });

    setNewNodeName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-500/30">
              <Plus className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white font-mono">Подключить Новое Устройство</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreateNodeSubmit} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Название Ноды / Устройства:</label>
            <input
              type="text"
              value={newNodeName}
              onChange={e => setNewNodeName(e.target.value)}
              placeholder="Например: Старый Galaxy S10 (Балкон)"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Тип платформы:</label>
              <select
                value={newNodeType}
                onChange={e => setNewNodeType(e.target.value as DeviceType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="android">Android смартфон</option>
                <option value="linux">Linux Сервер / ПК</option>
                <option value="desktop">Windows / macOS Station</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Память под секции:</label>
              <select
                value={newNodeStorageGb}
                onChange={e => setNewNodeStorageGb(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
              >
                <option value={16}>16 GB (1 секция • Базовый сейф)</option>
                <option value={32}>32 GB (2 секции • 4 GB сейф)</option>
                <option value={64}>64 GB (4 секции • 8 GB сейф)</option>
                <option value={128}>128 GB (8 секций • 16 GB сейф)</option>
                <option value={256}>256 GB (16 секций • 32 GB сейф)</option>
              </select>
            </div>
          </div>

          {/* Optical Pairing QR Code */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-cyan-400" />
                Оптический QR-код сопряжения ноды:
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(pairingUri);
                  setCopiedPairing(true);
                  setTimeout(() => setCopiedPairing(false), 2000);
                }}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] cursor-pointer"
              >
                {copiedPairing ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPairing ? 'Скопировано!' : 'Копировать URI'}</span>
              </button>
            </div>

            <div className="flex items-center justify-center p-2 bg-white rounded-lg">
              {pairingQrUrl ? (
                <img
                  src={pairingQrUrl}
                  alt="Pairing QR"
                  className="w-36 h-36"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-36 h-36 bg-slate-200 animate-pulse rounded" />
              )}
            </div>

            <p className="text-[10px] text-slate-400 text-center">
              Откройте камеру на подключаемом смартфоне для авторизации в текущем BIP-39 Swarm.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
            >
              Зарегистрировать Ноду
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
