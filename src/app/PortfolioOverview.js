'use client';

const COLORS = ['#f0b90b', '#0ecb81', '#5b8def', '#f6465d', '#a66cff', '#ff9f43', '#2ec4b6', '#9aa0a6'];

function formatUsd(value) {
  return (
    '$' +
    Number(value || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export default function PortfolioOverview({ spot = 0, futures = 0, holdings = {}, coins = [] }) {
  const safeHoldings = holdings || {};
  const items = [];

  if (Number(spot) > 0) items.push({ label: 'Spot cash (USD)', value: Number(spot) });
  if (Number(futures) > 0) items.push({ label: 'Futures cash (USD)', value: Number(futures) });

  coins.forEach((coin) => {
    const amount = Number(safeHoldings[coin.symbol] || 0);
    const price = Number(coin.rawPrice || 0);
    const value = amount * price;
    if (value > 0) items.push({ label: coin.symbol, value });
  });

  const total = items.reduce((sum, item) => sum + item.value, 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const segments = items.map((item, i) => {
    const fraction = total > 0 ? item.value / total : 0;
    const length = fraction * circumference;
    const segment = {
      ...item,
      color: COLORS[i % COLORS.length],
      length,
      offset,
      percent: fraction * 100,
    };
    offset += length;
    return segment;
  });

  return (
    <div className="bg-[#2b313a]/20 border border-[#2b313a] rounded-2xl p-4 space-y-4">
      <h3 className="font-bold text-white text-sm">📊 Portfolio Overview</h3>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-44 h-44 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#2b313a" strokeWidth="12" />
            {segments.map((seg) => (
              <circle
                key={seg.label}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth="12"
                strokeDasharray={seg.length + ' ' + (circumference - seg.length)}
                strokeDashoffset={-seg.offset}
                transform="rotate(-90 50 50)"
              />
            ))}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
            <div className="text-[10px] text-gray-400">Total balance</div>
            <div className="text-white font-bold text-sm leading-tight break-all">{formatUsd(total)}</div>
          </div>
        </div>

        <div className="flex-1 w-full space-y-2">
          {segments.length === 0 ? (
            <div className="text-gray-500 text-sm">No balance yet. Deposit to see your portfolio here.</div>
          ) : (
            segments.map((seg) => (
              <div key={seg.label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: seg.color }} />
                  <span className="text-white">{seg.label}</span>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">{formatUsd(seg.value)}</div>
                  <div className="text-[11px] text-gray-500">{seg.percent.toFixed(1)}%</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}