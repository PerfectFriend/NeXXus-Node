import React, { useState } from 'react';
import { 
  Key, Shield, Lock, AlertTriangle, Check, Copy, RefreshCw, 
  ArrowRight, ArrowLeft, ShieldAlert, Sparkles, Eye, EyeOff
} from 'lucide-react';
import { generateBip39Mnemonic, isValidBip39Mnemonic, deriveIdentityFromMnemonic } from '../utils/bip39';
import { setupPins } from '../utils/securityPin';
import { Bip39Identity } from '../types/nexxus';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (identity: Bip39Identity) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
}) => {
  const [step, setStep] = useState<'welcome' | 'seed_choice' | 'create_seed' | 'import_seed' | 'pin_setup' | 'panic_pin_setup'>('welcome');
  
  // Seed state
  const [generatedMnemonic, setGeneratedMnemonic] = useState<string[]>(() => generateBip39Mnemonic());
  const [importInput, setImportInput] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isBackupConfirmed, setIsBackupConfirmed] = useState(false);

  // PIN state
  const [primaryPin, setPrimaryPin] = useState('');
  const [confirmPrimaryPin, setConfirmPrimaryPin] = useState('');
  const [panicPin, setPanicPin] = useState('');
  const [confirmPanicPin, setConfirmPanicPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRegenerateMnemonic = () => {
    setGeneratedMnemonic(generateBip39Mnemonic());
    setIsCopied(false);
    setIsBackupConfirmed(false);
  };

  const handleCopyMnemonic = () => {
    navigator.clipboard.writeText(generatedMnemonic.join(' '));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleVerifyImportedSeed = () => {
    const words = importInput.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length !== 12 && words.length !== 24) {
      setPinError('Seed-фраза должна содержать ровно 12 или 24 слова.');
      return;
    }
    if (!isValidBip39Mnemonic(words)) {
      setPinError('Неверная контрольная сумма BIP-39! Проверьте правильность написания слов.');
      return;
    }
    setPinError(null);
    setGeneratedMnemonic(words);
    setStep('pin_setup');
  };

  const handleValidatePrimaryPin = () => {
    if (primaryPin.length < 4 || primaryPin.length > 6) {
      setPinError('Основной PIN-код должен содержать от 4 до 6 цифр.');
      return;
    }
    if (primaryPin !== confirmPrimaryPin) {
      setPinError('Введенные PIN-коды не совпадают!');
      return;
    }
    setPinError(null);
    setStep('panic_pin_setup');
  };

  const handleFinalizeOnboarding = () => {
    if (panicPin.length < 4 || panicPin.length > 6) {
      setPinError('Panic PIN-код должен содержать от 4 до 6 цифр.');
      return;
    }
    if (panicPin !== confirmPanicPin) {
      setPinError('Введенные Panic PIN-коды не совпадают!');
      return;
    }
    if (panicPin === primaryPin) {
      setPinError('Panic PIN обязан отличаться от Основного PIN-кода!');
      return;
    }

    setPinError(null);

    // Save security PINs securely
    setupPins(primaryPin, panicPin);

    // Derive deterministic identity
    const baseDerivation = deriveIdentityFromMnemonic(generatedMnemonic);
    const newIdentity: Bip39Identity = {
      mnemonic: generatedMnemonic,
      ...baseDerivation,
      createdAt: Date.now(),
      balances: {
        nexx: 100.0,
        ton: 10.0,
        usdc: 50.0,
        eth: 0.05,
        btc: 0.002,
      },
      unlockedNexx: 100.0,
      lockedNexx8Weeks: 0,
      vestingBatches: [],
      subscribedStorageGb: 16,
      dailyStorageExpenseNexx: 0,
      treasury: {
        poolBalanceNexx: 184500.0,
        dailyCollectedNexx: 41.6,
        dailyDistributedNexx: 210.5,
        totalSubscribedStorageGb: 1420,
        totalPaidForeignGb: 8940,
        ratePerGbPerDay: 1.25,
        lastEpochTimestamp: Date.now() - 3600 * 1000,
        epochNumber: 155,
      },
    };

    onComplete(newIdentity);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-hidden h-full h-[100dvh]">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[96dvh] p-4 sm:p-6 shadow-2xl relative text-slate-100 overflow-y-auto flex flex-col justify-between animate-in fade-in zoom-in-95 duration-200">
        
        {/* Step: Welcome */}
        {step === 'welcome' && (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="w-8 h-8 text-white" />
            </div>

            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
                Первичный Онбординг
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-3 font-mono">
                Добро пожаловать в NeXXus
              </h2>
              <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                Децентрализованная суверенная сеть. Никаких телефонных номеров, email или центральных серверов. 
                Ваш доступ защищен стандартом BIP-39 и PIN-кодом с защитой от принуждения.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" /> Криптография BIP-39
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  12-словный мастер-ключ шифрует личный сейф и onion-маршрутизацию.
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-red-400 font-bold text-xs flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" /> Panic PIN (Anti-Torture)
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Код под принуждением открывает пустой безопасный профиль.
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep('seed_choice')}
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
            >
              Начать настройку <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step: Seed Choice */}
        {step === 'seed_choice' && (
          <div className="space-y-6">
            <button
              onClick={() => setStep('welcome')}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Назад
            </button>

            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-black text-white font-mono">
                Инициализация Мастер-Ключа
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Выберите, как настроить криптографический ключ для вашего аккаунта
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setStep('create_seed')}
                className="w-full p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 hover:border-emerald-500 hover:bg-slate-900/80 transition text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-emerald-300 group-hover:text-emerald-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Создать новый ключ (BIP-39)
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Генерирует новую случайную сид-фразу из 12 слов с криптографической энтропией CSPRNG. Рекомендуется для новых пользователей.
                </p>
              </button>

              <button
                onClick={() => setStep('import_seed')}
                className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 transition text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-slate-200 group-hover:text-white flex items-center gap-2">
                    <Key className="w-4 h-4 text-cyan-400" />
                    Восстановить / Подключить по Seed-фразе
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Используйте существующую мнемоническую фразу из 12 или 24 слов для подключения к вашей сети нод и хранилищу.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Step: Create Seed */}
        {step === 'create_seed' && (
          <div className="space-y-5">
            <button
              onClick={() => setStep('seed_choice')}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Назад
            </button>

            <div>
              <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-400" />
                Ваша BIP-39 Мнемоническая Фраза
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Запишите эти 12 слов в точном порядке и сохраните в надежном месте. Они дают полный доступ к вашим файлам и средствам.
              </p>
            </div>

            {/* Word Grid */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              {generatedMnemonic.map((word, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex items-center gap-2 text-xs"
                >
                  <span className="text-[10px] font-mono text-slate-500 w-4 select-none">
                    {idx + 1}.
                  </span>
                  <span className="font-mono font-bold text-emerald-300">
                    {word}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                onClick={handleCopyMnemonic}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-2 transition"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                {isCopied ? 'Скопировано!' : 'Скопировать слова'}
              </button>

              <button
                onClick={handleRegenerateMnemonic}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" /> Сгенерировать заново
              </button>
            </div>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 cursor-pointer">
              <input
                type="checkbox"
                checked={isBackupConfirmed}
                onChange={e => setIsBackupConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-xs text-amber-200 leading-relaxed">
                Я подтверждаю, что записал(а) сид-фразу офлайн. Я понимаю, что восстановить доступ без неё невозможно.
              </span>
            </label>

            <button
              disabled={!isBackupConfirmed}
              onClick={() => setStep('pin_setup')}
              className={`w-full py-3 px-6 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${
                isBackupConfirmed
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Продолжить к PIN-коду <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step: Import Seed */}
        {step === 'import_seed' && (
          <div className="space-y-5">
            <button
              onClick={() => setStep('seed_choice')}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Назад
            </button>

            <div>
              <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
                <Key className="w-5 h-5 text-cyan-400" />
                Ввод существующей Seed-фразы
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Введите 12 или 24 слова BIP-39, разделяя пробелами:
              </p>
            </div>

            <div>
              <textarea
                value={importInput}
                onChange={e => {
                  setImportInput(e.target.value);
                  setPinError(null);
                }}
                placeholder="shield orbit quantum cipher matrix battery whisper antenna harbor gravity beacon voyage"
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-xs sm:text-sm font-mono text-cyan-200 focus:outline-none transition resize-none leading-relaxed"
              />
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                Слов введено: {importInput.trim().split(/\s+/).filter(Boolean).length} / 12 (или 24)
              </div>
            </div>

            {pinError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <button
              onClick={handleVerifyImportedSeed}
              className="w-full py-3 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25"
            >
              Проверить и продолжить <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step: Setup Primary PIN */}
        {step === 'pin_setup' && (
          <div className="space-y-5">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                Шаг 2 из 3
              </span>
              <h2 className="text-xl font-bold text-white font-mono mt-2 flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-400" />
                Задайте Основной PIN-код входа
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Этот PIN защищает вход в приложение. При неправильном вводе применяется удваиваемый кулдаун.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  Основной PIN (4-6 цифр)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={primaryPin}
                  onChange={e => {
                    setPrimaryPin(e.target.value.replace(/\D/g, ''));
                    setPinError(null);
                  }}
                  placeholder="••••"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-3 px-4 text-center font-mono text-xl tracking-[0.5em] text-white focus:outline-none transition"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  Подтвердите Основной PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={confirmPrimaryPin}
                  onChange={e => {
                    setConfirmPrimaryPin(e.target.value.replace(/\D/g, ''));
                    setPinError(null);
                  }}
                  placeholder="••••"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-3 px-4 text-center font-mono text-xl tracking-[0.5em] text-white focus:outline-none transition"
                />
              </div>
            </div>

            {pinError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <button
              onClick={handleValidatePrimaryPin}
              className="w-full py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
            >
              Далее: Настройка Panic PIN <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step: Setup Panic PIN */}
        {step === 'panic_pin_setup' && (
          <div className="space-y-5">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-red-400 bg-red-950/60 border border-red-500/30 px-2.5 py-0.5 rounded-full">
                Шаг 3 из 3 • Anti-Torture
              </span>
              <h2 className="text-xl font-bold text-white font-mono mt-2 flex items-center gap-2 text-red-300">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                Задайте Panic PIN (Код под принуждением)
              </h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Если злоумышленники требуют разблокировать телефон силой — введите этот <strong>Panic PIN</strong>. 
                Приложение откроется в <strong>демонстрационном режиме</strong>: с чистым сейфом, нулевым балансом и без единого следа ваших секретов и сид-фразы.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/30 text-[11px] text-red-200 leading-relaxed">
              ⚠️ <strong>Важно:</strong> Panic PIN должен обязательно отличаться от Основного PIN-кода!
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  Panic PIN (4-6 цифр)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={panicPin}
                  onChange={e => {
                    setPanicPin(e.target.value.replace(/\D/g, ''));
                    setPinError(null);
                  }}
                  placeholder="••••"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl py-3 px-4 text-center font-mono text-xl tracking-[0.5em] text-red-200 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  Подтвердите Panic PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={confirmPanicPin}
                  onChange={e => {
                    setConfirmPanicPin(e.target.value.replace(/\D/g, ''));
                    setPinError(null);
                  }}
                  placeholder="••••"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl py-3 px-4 text-center font-mono text-xl tracking-[0.5em] text-red-200 focus:outline-none transition"
                />
              </div>
            </div>

            {pinError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <button
              onClick={handleFinalizeOnboarding}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
            >
              Завершить онбординг и войти в NeXXus <Check className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
