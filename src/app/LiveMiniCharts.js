'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

const CHARTS = [
  { label: 'Bitcoin', symbol: 'BINANCE:BTCUSDT' },
  { label: 'Ethereum', symbol: 'BINANCE:ETHUSDT' },
  { label: 'Solana', symbol: 'BINANCE:SOLUSDT' },
];

function MiniChart({ symbol }) {
  const ref = useRef(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return undefined;

    container.innerHTML = '';

    const widget = document.createElement('div');
    widget.className = 'tradingview-widget-container__widget';
    container.appendChild(widget);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol,
      width: '100%',
      height: '100%',
      locale: 'en',
      dateRange: '1D',
      colorTheme: 'dark',
      isTransparent: true,
      autosize: true,
      largeChartUrl: '',
      chartOnly: false,
      noTimeScale: false,
    });
    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, [symbol]);

  return (
    <div className="bg-[#181a20] border border-gray-800 rounded-xl overflow-hidden" style={{ height: 220 }}>
      <div
        ref={ref}
        className="tradingview-widget-container"
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
}

export default function LiveMiniCharts() {
  return (
    <div className="bg-[#2b313a]/20 border border-[#2b313a] rounded-2xl p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-white text-sm">📈 Live Charts</h3>
        <Link href="/market" className="text-[#f0b90b] hover:underline font-semibold text-xs">
          All markets →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {CHARTS.map((chart) => (
          <MiniChart key={chart.symbol} symbol={chart.symbol} />
        ))}
      </div>
    </div>
  );
}