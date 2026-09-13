import React from 'react';
import { ArrowRightLeft, Lock } from 'lucide-react';
import { Bip39Identity, OrderBookItem } from '../../types/nexxus';

export type SupportedPair = 'NEXX/USDC' | 'NEXX/TON' | 'NEXX/ETH' | 'NEXX/BTC';

interface DexSwapPanelProps {
  identity: Bip39Identity;
  selectedPair: SupportedPair;
  setSelectedPair: (pair: SupportedPair) => void;
  swapType: 'buy' | 'sell';
  setSwapType: (type: 'buy' | 'sell') => void;
  swapAmount: string;
  setSwapAmount: (amount: string) => void;
  currentPrice: number;
  calculatedTotal: number;
  orders: OrderBookItem[];
  onExecuteSwap: (e: React.FormEvent) => void;
}

export const DexSwapPanel: React.FC<DexSwapPanelProps> = ({
  identity,
  selectedPair,
  setSelectedPair,
  swapType,
  setSwapType,
  swapAmount,
  setSwapAmount,
  currentPrice,
  calculatedTotal,
  orders,
  onExecuteSwap,
}) => {
  const numAmount = parseFloat(swapAmount) || 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-amber-400" />
          Мгновенный Обмен Токенов
        </h2>

        {/* Buy / Sell toggle */}
        <div className="flex p-1 rounded-lg bg-slate-950 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setSwapType('buy')}
            className={`px-3 py-1 rounded-md font-bold transition cursor-pointer ${
              swapType === 'buy' ? 'bg-emerald-600 text-white' : 'text-slate-400'
            }`}
          >
            Купить $NEXX
          </button>
          <button
            type="button"
            onClick={() => setSwapType('sell')}
            className={`px-3 py-1 rounded-md font-bold transition cursor-pointer ${
              swapType === 'sell' ? 'bg-amber-600 text-white' : 'text-slate-400'
            }`}
          >
            Продать $NEXX
          </button>
        </div>
      </div>

      <form onSubmit={onExecuteSwap} className="space-y-4 text-xs">
        {/* Pair Selector */}
        <div>
          <label className="block text-slate-400 mb-1">Торговая пара:</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['NEXX/USDC', 'NEXX/TON', 'NEXX/ETH', 'NEXX/BTC'] as const).map(pair => (
              <button
                key={pair}
                type="button"
                onClick={() => setSelectedPair(pair)}
                className={`py-2 rounded-xl font-mono text-[11px] font-bold border transition cursor-pointer ${
                  selectedPair === pair
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {pair}
              </button>
            ))}
          </div>
        </div>

        {/* Input Amount */}
        <div className="space-y-1">
          <div className="flex justify-between text-slate-400">
            <span>Объём ($NEXX):</span>
            {swapType === 'sell' ? (
              <span className="text-emerald-400 font-bold">
                Доступно к продаже: {(identity.unlockedNexx ?? 0).toFixed(1)} NEXX
              </span>
            ) : (
              <span>Баланс: {(identity.balances?.nexx ?? 0).toFixed(1)} NEXX</span>
            )}
          </div>
          <input
            type="number"
            min="1"
            step="any"
            value={swapAmount}
            onChange={e => setSwapAmount(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-base font-mono text-white focus:outline-none focus:border-amber-500"
          />
          {swapType === 'sell' && (
            <div className="text-[10px] text-amber-300/80 flex items-center gap-1 mt-1">
              <Lock className="w-3 h-3 text-amber-400 shrink-0" />
              Токены из 8-недельного лока ({(identity.lockedNexx8Weeks ?? 0).toFixed(1)} NEXX) нельзя продать до созревания!
            </div>
          )}
        </div>

        {/* Calculated Output */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex justify-between text-slate-400">
            <span>Итоговая цена:</span>
            <span className="font-mono text-white font-semibold">
              1 $NEXX ≈ {currentPrice} {selectedPair.split('/')[1]}
            </span>
          </div>
          <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-850">
            <span className="font-bold">К оплате / зачислению:</span>
            <span className="font-mono text-emerald-400 font-bold text-sm">
              {calculatedTotal.toFixed(4)} {selectedPair.split('/')[1]}
            </span>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 font-black text-sm transition hover:opacity-90 shadow-lg shadow-amber-950/40 cursor-pointer"
        >
          {swapType === 'buy' ? 'Купить $NEXX по рынку' : 'Продать разблокированные $NEXX'}
        </button>
      </form>

      {/* Mini Order Book preview */}
      <div className="pt-2 border-t border-slate-800 space-y-2">
        <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider block">
          Стакан ордеров {selectedPair}:
        </span>
        <div className="space-y-1 font-mono text-[10px]">
          {orders.slice(0, 4).map(o => (
            <div key={o.id} className="flex justify-between text-slate-400 bg-slate-950/60 p-1.5 rounded">
              <span className={o.type === 'buy' ? 'text-emerald-400' : 'text-red-400'}>
                {o.type.toUpperCase()} @ {o.price}
              </span>
              <span>{o.amount.toLocaleString()} NEXX</span>
              <span className="text-slate-500">{o.total.toFixed(1)} USDC</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
