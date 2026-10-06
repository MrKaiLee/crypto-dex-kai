'use client';

function parseChange(change) {
  const n = parseFloat(String(change).replace('%', '').replace('+', ''));
  return Number.isNaN(n) ? 0 : n;
}

function MoverRow({ coin, onSelect }) {
  const isUp = parseChange(coin.change) >= 0;
  return (
    <div
      onClick={() => onSelect && onSelect(coin)}
      className="flex justify-between items-center bg-[#181a20] border border-gray-800 hover:border-[#f0b90b] p-3 rounded-xl cursor-pointer transition"
    >
      <div>
        <div className="font-bold text-white text-sm">{coin.symbol}</div>
        <div className="text-gray-400 text-xs">{coin.name}</div>
      </div>
      <div className="text-right">
        <div className="text-white text-sm font-semibold">${coin.price}</div>
        <div className={isUp ? 'text-[#0ecb81] text-xs' : 'text-red-400 text-xs'}>{coin.change}</div>
      </div>
    </div>
  );
}

export default function TopMovers({ coins = [], onSelect }) {
  if (!coins || coins.length === 0) return null;

  const gainers = [...coins]
    .filter((c) => parseChange(c.change) > 0)
    .sort((a, b) => parseChange(b.change) - parseChange(a.change))
    .slice(0, 3);

  const losers = [...coins]
    .filter((c) => parseChange(c.change) < 0)
    .sort((a, b) => parseChange(a.change) - parseChange(b.change))
    .slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-[#2b313a]/20 border border-[#2b313a] rounded-2xl p-4 space-y-3">
        <h3 className="font-bold text-white text-sm">🚀 Top Gainers (24h)</h3>
        {gainers.length === 0 ? (
          <div className="text-gray-500 text-sm">No gainers right now</div>
        ) : (
          gainers.map((coin) => <MoverRow key={coin.symbol} coin={coin} onSelect={onSelect} />)
        )}
      </div>

      <div className="bg-[#2b313a]/20 border border-[#2b313a] rounded-2xl p-4 space-y-3">
        <h3 className="font-bold text-white text-sm">📉 Top Losers (24h)</h3>
        {losers.length === 0 ? (
          <div className="text-gray-500 text-sm">No losers right now</div>
        ) : (
          losers.map((coin) => <MoverRow key={coin.symbol} coin={coin} onSelect={onSelect} />)
        )}
      </div>
    </div>
  );
}