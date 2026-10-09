'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

// Maps our symbols to display names and CoinGecko ids (used for live price)
const COINS = {
  BTCUSDT: { name: 'Bitcoin', geckoId: 'bitcoin' },
  ETHUSDT: { name: 'Ethereum', geckoId: 'ethereum' },
  BNBUSDT: { name: 'BNB', geckoId: 'binancecoin' },
  SOLUSDT: { name: 'Solana', geckoId: 'solana' },
  XRPUSDT: { name: 'XRP', geckoId: 'ripple' },
  ADAUSDT: { name: 'Cardano', geckoId: 'cardano' },
  DOGEUSDT: { name: 'Dogecoin', geckoId: 'dogecoin' },
};

// Small-value coins need more decimal places to stay accurate
function formatPrice(value) {
  const decimals = value >= 1 ? 2 : value >= 0.01 ? 4 : 6;
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function MarketDetail() {
  const params = useParams();
  const router = useRouter();

  const rawSymbol = params.symbol ? String(params.symbol).toUpperCase() : 'BTCUSDT';
  // Format the symbol for the TradingView widget (e.g., BINANCE:BTCUSDT)
  const tvSymbol = rawSymbol.includes(':') ? rawSymbol : 'BINANCE:' + rawSymbol;
  const coin = COINS[rawSymbol];

  const containerRef = useRef(null);
  const [price, setPrice] = useState(null);
  const [change, setChange] = useState(null);

  // TradingView chart
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

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
      symbol: tvSymbol,
      interval: '60',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: '#0f172a',
      hide_side_toolbar: true,
      allow_symbol_change: false,
      save_image: false,
      support_host: 'https://www.tradingview.com',
    });
    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, [tvSymbol]);

  // Live price and 24h change from our own cached route
  useEffect(() => {
    if (!coin) return undefined;
    let cancelled = false;

    async function loadPrice() {
      try {
        const res = await fetch('/api/prices');
        if (!res.ok) throw new Error('Bad response');
        const data = await res.json();
        const entry = data[coin.geckoId];
        if (entry && !cancelled) {
          setPrice(entry.usd);
          setChange(entry.usd_24h_change || 0);
        }
      } catch (e) {
        console.error('Failed to fetch live price:', e);
      }
    }

    loadPrice();
    const interval = setInterval(loadPrice, 8000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [coin]);

  const isUp = change !== null && change >= 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 space-y-4">
      <div className="flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="bg-slate-800 px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-slate-700 cursor-pointer"
        >
          ← Back
        </button>
        <h1 className="text-lg font-bold">{rawSymbol} Live Market</h1>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex justify-between items-center">
        <div>
          <div className="font-bold text-base">{coin ? coin.name : rawSymbol}</div>
          <div className="text-xs text-slate-400">{rawSymbol}</div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold">{price !== null ? '$' + formatPrice(price) : '--'}</div>
          <div className={'text-xs ' + (change === null ? 'text-slate-500' : isUp ? 'text-green-400' : 'text-red-400')}>
            {change !== null ? (isUp ? '+' : '') + change.toFixed(2) + '% (24h)' : ''}
          </div>
        </div>
      </div>

      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
        style={{ height: 520 }}
      >
        <div
          ref={containerRef}
          className="tradingview-widget-container"
          style={{ height: '100%', width: '100%' }}
        />
      </div>
    </div>
  );
}