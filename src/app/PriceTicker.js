'use client';

export default function PriceTicker({ coins = [] }) {
  if (!coins || coins.length === 0) return null;

  // Duplicate the list so the loop looks seamless
  const items = [...coins, ...coins];

  return (
    <div className="ticker-wrap bg-[#181a20] border border-[#2b313a] rounded-xl overflow-hidden">
      <style>{`
        @keyframes ticker-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .ticker-track {
          animation: ticker-scroll 40s linear infinite;
        }
        .ticker-wrap:hover .ticker-track {
          animation-play-state: paused;
        }
      `}</style>
      <div className="ticker-track flex w-max py-2">
        {items.map((coin, i) => {
          const isUp = String(coin.change).startsWith('+');
          return (
            <div
              key={coin.symbol + '-' + i}
              className="flex items-center gap-2 whitespace-nowrap text-sm pr-8"
            >
              <span className="font-bold text-white">{coin.symbol}</span>
              <span className="text-gray-300">${coin.price}</span>
              <span className={isUp ? 'text-[#0ecb81]' : 'text-red-400'}>{coin.change}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}