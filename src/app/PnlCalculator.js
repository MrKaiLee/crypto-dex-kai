'use client';

import { useState } from 'react';

const QUICK_LEVERAGE = [1, 5, 10, 20, 50, 100];

function fmt(value, digits = 2) {
  if (!Number.isFinite(value)) return '-';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export default function PnlCalculator() {
  const [side, setSide] = useState('long');
  const [entry, setEntry] = useState('100');
  const [exit, setExit] = useState('105');
  const [margin, setMargin] = useState('100');
  const [leverage, setLeverage] = useState(10);

  const entryN = Number(entry);
  const exitN = Number(exit);
  const marginN = Number(margin);
  const valid = entryN > 0 && exitN > 0 && marginN > 0 && leverage >= 1;

  let result = null;
  if (valid) {
    const notional = marginN * leverage;
    const quantity = notional / entryN;
    const rawPnl = side === 'long' ? quantity * (exitN - entryN) : quantity * (entryN - exitN);
    const liquidated = rawPnl <= -marginN;
    const pnl = liquidated ? -marginN : rawPnl;
    const roe = (pnl / marginN) * 100;
    const liqPrice = side === 'long' ? entryN * (1 - 1 / leverage) : entryN * (1 + 1 / leverage);
    result = { notional, quantity, pnl, roe, liquidated, liqPrice, wipeout: 100 / leverage };
  }

  const isProfit = result ? result.pnl >= 0 : true;
  const inputClass =
    'w-full bg-[#181a20] border border-gray-700 p-2 rounded text-white outline-none focus:border-[#f0b90b] text-sm';

  return (
    <div className="bg-[#2b313a]/20 border border-[#2b313a] rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white text-sm">🧮 PNL & Liquidation Calculator</h3>
        <span className="text-[10px] text-gray-500">Futures style, simplified</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setSide('long')}
          className={
            'py-2 rounded-xl text-sm font-bold cursor-pointer transition ' +
            (side === 'long'
              ? 'bg-[#0ecb81] text-black'
              : 'bg-[#181a20] border border-gray-800 text-gray-400')
          }
        >
          Long
        </button>
        <button
          onClick={() => setSide('short')}
          className={
            'py-2 rounded-xl text-sm font-bold cursor-pointer transition ' +
            (side === 'short'
              ? 'bg-[#f6465d] text-white'
              : 'bg-[#181a20] border border-gray-800 text-gray-400')
          }
        >
          Short
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="block">
          <span className="text-gray-400 text-xs block mb-1">Entry price</span>
          <input
            type="number"
            step="any"
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="text-gray-400 text-xs block mb-1">Exit price</span>
          <input
            type="number"
            step="any"
            value={exit}
            onChange={(e) => setExit(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="text-gray-400 text-xs block mb-1">Margin (USDT)</span>
          <input
            type="number"
            step="any"
            value={margin}
            onChange={(e) => setMargin(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-xs">Leverage</span>
          <span className="text-[#f0b90b] font-bold text-sm">{leverage}x</span>
        </div>
        <input
          type="range"
          min="1"
          max="125"
          value={leverage}
          onChange={(e) => setLeverage(Number(e.target.value))}
          className="w-full accent-[#f0b90b]"
        />
        <div className="flex gap-2 flex-wrap">
          {QUICK_LEVERAGE.map((value) => (
            <button
              key={value}
              onClick={() => setLeverage(value)}
              className={
                'px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ' +
                (leverage === value
                  ? 'bg-[#f0b90b] text-black'
                  : 'bg-[#181a20] border border-gray-800 text-gray-400')
              }
            >
              {value}x
            </button>
          ))}
        </div>
      </div>

      {!result && (
        <div className="text-gray-500 text-sm">Enter valid prices and margin to see the result.</div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#181a20] border border-gray-800 rounded-xl p-3">
              <div className="text-gray-400 text-[11px]">PNL</div>
              <div className={'text-lg font-bold ' + (isProfit ? 'text-[#0ecb81]' : 'text-[#f6465d]')}>
                {isProfit ? '+' : ''}
                {fmt(result.pnl)} USDT
              </div>
            </div>
            <div className="bg-[#181a20] border border-gray-800 rounded-xl p-3">
              <div className="text-gray-400 text-[11px]">ROE</div>
              <div className={'text-lg font-bold ' + (isProfit ? 'text-[#0ecb81]' : 'text-[#f6465d]')}>
                {isProfit ? '+' : ''}
                {fmt(result.roe)}%
              </div>
            </div>
            <div className="bg-[#181a20] border border-gray-800 rounded-xl p-3">
              <div className="text-gray-400 text-[11px]">Position size</div>
              <div className="text-white font-semibold">{fmt(result.notional)} USDT</div>
            </div>
            <div className="bg-[#181a20] border border-gray-800 rounded-xl p-3">
              <div className="text-gray-400 text-[11px]">Liquidation price (approx.)</div>
              <div className="text-white font-semibold">{fmt(result.liqPrice, 4)}</div>
            </div>
          </div>

          {result.liquidated && (
            <div className="bg-[#f6465d]/10 border border-[#f6465d]/40 text-[#f6465d] text-xs rounded-xl p-3">
              At this exit price the position would be liquidated: the whole margin is lost.
            </div>
          )}

          <div className="bg-[#f0b90b]/10 border border-[#f0b90b]/30 text-gray-300 text-xs rounded-xl p-3">
            At {leverage}x leverage, a price move of only {fmt(result.wipeout)}% against your position is enough
            to wipe out your margin. Higher leverage means higher risk.
          </div>
        </div>
      )}

      <div className="text-[10px] text-gray-600">
        Simplified estimate. Real exchanges also include fees, funding and maintenance margin. For learning only,
        not financial advice.
      </div>
    </div>
  );
}