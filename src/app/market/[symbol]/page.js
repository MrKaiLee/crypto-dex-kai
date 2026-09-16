'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function MarketDetail() {
  const params = useParams();
  const router = useRouter();
  
  // Clean symbol to match TradingView format (e.g., BINANCE:BTCUSDT)
  const rawSymbol = params.symbol ? params.symbol.toUpperCase() : 'BTCUSDT';
  // If user passed something like BTCUSDT, format it for TradingView widget nicely
  const tvSymbol = rawSymbol.includes(':') ? rawSymbol : `BINANCE:${rawSymbol}`;

  const containerRef = useRef(null);

  useEffect(() => {
    // Clear previous widget if any
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": tvSymbol,
      "interval": "D",
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "enable_publishing": false,
      "hide_top_toolbar": false,
      "hide_legend": false,
      "save_image": false,
      "calendar": false,
      "support_host": "https://www.tradingview.com"
    });

    containerRef.current.appendChild(script);
  }, [tvSymbol]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => router.back()} 
          className="bg-slate-800 px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-slate-700"
        >
          ← Back
        </button>
        <h1 className="text-lg font-bold">{rawSymbol} Live Market</h1>
      </div>

      {/* TradingView Real Chart Container */}
      <div className="bg-slate-900 border border-slate-800 p-2 rounded-2xl flex-1 flex flex-col min-h-[500px]">
        <div ref={containerRef} className="w-full h-full min-h-[480px] rounded-xl overflow-hidden"></div>
      </div>
    </div>
  );
}