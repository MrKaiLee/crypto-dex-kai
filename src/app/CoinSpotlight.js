'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const ROTATE_MS = 5000;

export default function CoinSpotlight({ coins = [] }) {
  // Stablecoins barely move, so they are left out of the spotlight
  const list = coins.filter((c) => c.symbol !== 'USDT');
  const count = list.length;
  const [index, setIndex] = useState(0);

  // Move to the next coin every few seconds (the timer restarts whenever the coin changes)
  useEffect(() => {
    if (count < 2) return undefined;
    const timer = setTimeout(() => setIndex((prev) => (prev + 1) % count), ROTATE_MS);
    return () => clearTimeout(timer);
  }, [index, count]);

  if (count === 0) return null;

  const current = index % count;
  const coin = list[current];
  const isUp = String(coin.change).startsWith('+');

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#f0b90b]/10 via-[#1e2329] to-[#181a20] border border-[#2b313a] rounded-2xl p-4">
      <style>{`
        @keyframes spotlightIn {
          from { opacity: 0; transform: translateX(18px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes coinFlip {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(360deg); }
        }
        @keyframes ringSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes progressFill {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        .spotlight-slide { animation: spotlightIn 0.5s ease backwards; }
        .spotlight-coin { animation: coinFlip 0.9s ease-in-out; }
        .spotlight-ring { animation: ringSpin 2.5s linear infinite; }
        .spotlight-progress { transform-origin: left; animation: progressFill ${ROTATE_MS}ms linear forwards; }
        @media (prefers-reduced-motion: reduce) {
          .spotlight-slide, .spotlight-coin, .spotlight-ring, .spotlight-progress { animation: none; }
        }
      `}</style>

      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-white text-sm">✨ Coin Spotlight</h3>
        <Link href="/market" className="text-[#f0b90b] hover:underline font-semibold text-xs">
          All markets →
        </Link>
      </div>

      <Link
        key={coin.symbol}
        href={'/market/' + String(coin.symbol).toLowerCase() + 'usdt'}
        className="spotlight-slide flex items-center gap-4"
      >
        <div className="relative w-16 h-16 shrink-0" style={{ perspective: '400px' }}>
          <div className="spotlight-ring absolute inset-0 rounded-full border-2 border-transparent border-t-[#f0b90b] border-r-[#f0b90b]/40" />
          <div className="spotlight-coin absolute inset-1.5 rounded-full bg-gradient-to-br from-[#f0b90b] to-[#b8860b] flex items-center justify-center text-black font-extrabold text-xs shadow-lg">
            {coin.symbol}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-gray-400 text-xs truncate">{coin.name}</div>
          <div className="text-white text-2xl font-bold">${coin.price}</div>
          <div className={isUp ? 'text-[#0ecb81] text-xs font-semibold' : 'text-red-400 text-xs font-semibold'}>
            {coin.change} (24h)
          </div>
        </div>
      </Link>

      <div className="mt-4 h-1 rounded-full bg-[#2b313a] overflow-hidden">
        <div key={current} className="spotlight-progress h-full w-full bg-[#f0b90b]" />
      </div>

      <div className="flex justify-center gap-1.5 mt-3">
        {list.map((c, i) => (
          <button
            key={c.symbol}
            onClick={() => setIndex(i)}
            aria-label={'Show ' + c.name}
            className={
              i === current
                ? 'w-5 h-1.5 rounded-full bg-[#f0b90b] cursor-pointer'
                : 'w-1.5 h-1.5 rounded-full bg-gray-600 cursor-pointer'
            }
          />
        ))}
      </div>
    </div>
  );
}