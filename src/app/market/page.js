'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

// Maps our symbols to CoinGecko's ids so we can fetch live prices
const COINGECKO_IDS = {
  BTCUSDT: 'bitcoin',
  ETHUSDT: 'ethereum',
  BNBUSDT: 'binancecoin',
  SOLUSDT: 'solana',
  XRPUSDT: 'ripple',
  ADAUSDT: 'cardano',
  DOGEUSDT: 'dogecoin',
};

const INITIAL_LIST = [
  { name: 'Bitcoin', symbol: 'BTCUSDT', price: '75,531.90', change: '-0.15%' },
  { name: 'Ethereum', symbol: 'ETHUSDT', price: '2,391.90', change: '-0.27%' },
  { name: 'BNB', symbol: 'BNBUSDT', price: '706.14', change: '-0.83%' },
  { name: 'Solana', symbol: 'SOLUSDT', price: '96.70', change: '-0.20%' },
  { name: 'XRP', symbol: 'XRPUSDT', price: '1.2793', change: '-0.31%' },
  { name: 'Cardano', symbol: 'ADAUSDT', price: '0.1927', change: '-1.38%' },
  { name: 'Dogecoin', symbol: 'DOGEUSDT', price: '0.07928', change: '-1.00%' },
];

const FAVORITES_KEY = 'market_favorites';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'gainers', label: 'Gainers' },
  { id: 'losers', label: 'Losers' },
  { id: 'favorites', label: '★ Favorites' },
];

// Small-value coins need more decimal places to stay accurate
function formatPrice(value) {
  const decimals = value >= 1 ? 2 : value >= 0.01 ? 4 : 6;
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Turns strings like "75,531.90" or "+1.25%" into numbers
function toNumber(value) {
  const n = parseFloat(String(value).replace(/,/g, '').replace('%', '').replace('+', ''));
  return Number.isNaN(n) ? 0 : n;
}

export default function MarketPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [cryptoList, setCryptoList] = useState(INITIAL_LIST);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [favorites, setFavorites] = useState([]);
  const [pricesLive, setPricesLive] = useState(false);

  // Load saved favorites from this browser
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setFavorites(parsed);
      }
    } catch (e) {
      // Storage may be unavailable; favorites simply start empty
    }
  }, []);

  function toggleFavorite(symbol) {
    const next = favorites.includes(symbol)
      ? favorites.filter((s) => s !== symbol)
      : [...favorites, symbol];
    setFavorites(next);
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    } catch (e) {
      // Ignore storage errors
    }
  }

  // Fetch live crypto prices from our own cached route (avoids CoinGecko rate limits)
  useEffect(() => {
    const fetchLivePrices = async () => {
      try {
        const response = await fetch('/api/prices');
        if (!response.ok) throw new Error('Bad response');
        const data = await response.json();

        setCryptoList((prevList) =>
          prevList.map((coin) => {
            const geckoId = COINGECKO_IDS[coin.symbol];
            if (geckoId && data[geckoId]) {
              const rawPrice = data[geckoId].usd;
              const rawChange = data[geckoId].usd_24h_change || 0;
              return {
                ...coin,
                price: formatPrice(rawPrice),
                change: (rawChange >= 0 ? '+' : '') + rawChange.toFixed(2) + '%',
              };
            }
            return coin;
          })
        );
        setPricesLive(true);
      } catch (error) {
        console.error('Failed to fetch live prices:', error);
        setPricesLive(false);
      }
    };

    fetchLivePrices();
    const interval = setInterval(fetchLivePrices, 8000);
    return () => clearInterval(interval);
  }, []);

  const upCount = cryptoList.filter((c) => toNumber(c.change) > 0).length;
  const downCount = cryptoList.filter((c) => toNumber(c.change) < 0).length;

  let visibleCoins = cryptoList.filter(
    (coin) =>
      coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filter === 'gainers') visibleCoins = visibleCoins.filter((c) => toNumber(c.change) > 0);
  if (filter === 'losers') visibleCoins = visibleCoins.filter((c) => toNumber(c.change) < 0);
  if (filter === 'favorites') visibleCoins = visibleCoins.filter((c) => favorites.includes(c.symbol));

  visibleCoins = [...visibleCoins];
  if (sortBy === 'price') visibleCoins.sort((a, b) => toNumber(b.price) - toNumber(a.price));
  if (sortBy === 'change') visibleCoins.sort((a, b) => toNumber(b.change) - toNumber(a.change));
  if (sortBy === 'name') visibleCoins.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      <div className="flex justify-between items-center mb-6">
        <Link href="/" className="text-sm bg-slate-800 px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-700">
          ← Back to Home
        </Link>
        <h1 className="text-xl font-bold">Markets</h1>
      </div>

      <div className="mb-4 flex items-center justify-between text-xs bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
        <div className="flex gap-4">
          <span className="text-green-400">▲ {upCount} up</span>
          <span className="text-red-400">▼ {downCount} down</span>
        </div>
        <span className={pricesLive ? 'text-green-400' : 'text-yellow-400'}>
          {pricesLive ? '● Live prices' : '● Updating prices...'}
        </span>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search coin (e.g. BTC, ETH)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
        />
      </div>

      <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={
                'px-3 py-1.5 rounded-lg text-sm cursor-pointer transition ' +
                (filter === f.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white')
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-purple-500"
        >
          <option value="default">Sort: Default</option>
          <option value="price">Price (high to low)</option>
          <option value="change">24h change (high to low)</option>
          <option value="name">Name (A to Z)</option>
        </select>
      </div>

      <div className="space-y-3">
        {visibleCoins.length === 0 && (
          <div className="text-slate-500 text-sm py-6 text-center">
            {filter === 'favorites' && searchQuery === ''
              ? 'No favorites yet. Tap the star next to a coin to add it.'
              : 'No coins found.'}
          </div>
        )}

        {visibleCoins.map((coin) => {
          const isFavorite = favorites.includes(coin.symbol);
          return (
            <div
              key={coin.symbol}
              className="bg-slate-900 border border-slate-800 rounded-xl flex items-center hover:border-slate-700 transition"
            >
              <button
                type="button"
                onClick={() => toggleFavorite(coin.symbol)}
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                className={
                  'pl-4 pr-3 py-4 text-xl leading-none cursor-pointer ' +
                  (isFavorite ? 'text-yellow-400' : 'text-slate-600 hover:text-slate-400')
                }
              >
                {isFavorite ? '★' : '☆'}
              </button>

              <Link
                href={`/market/${coin.symbol.toLowerCase()}`}
                className="flex-1 flex justify-between items-center py-4 pr-4"
              >
                <div>
                  <p className="font-bold">{coin.symbol}</p>
                  <p className="text-sm text-slate-400">{coin.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{coin.price}</p>
                  <p className={`text-sm ${coin.change.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
                    {coin.change}
                  </p>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}