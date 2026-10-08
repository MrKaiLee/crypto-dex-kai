'use client';

import { useEffect, useRef } from 'react';

export default function TradingChart({ symbol }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !symbol || symbol === 'USDT') return undefined;

    container.innerHTML = '';

    const widget = document.createElement('div');
    widget.className = 'tradingview-widget-container__widget';
    widget.style.height = '100%';
    widget.style.width = '100%';
    container.appendChild(widget);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: 'BINANCE:' + symbol + 'USDT',
      interval: '60',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: '#181a20',
      hide_side_toolbar: true,
      allow_symbol_change: false,
      save_image: false,
      support_host: 'https://www.tradingview.com',
    });
    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, [symbol]);

  if (symbol === 'USDT') {
    return (
      <div className="bg-[#181a20] h-72 rounded-xl border border-gray-800 flex items-center justify-center text-gray-500 text-sm">
        Chart is not available for USDT.
      </div>
    );
  }

  return (
    <div className="bg-[#181a20] h-72 rounded-xl border border-gray-800 overflow-hidden">
      <div
        ref={containerRef}
        className="tradingview-widget-container"
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
}