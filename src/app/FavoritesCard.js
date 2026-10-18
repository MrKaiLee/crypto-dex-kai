'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const FAVORITES_KEY = 'market_favorites';

export default function FavoritesCard({ coins = [] }) {
  const [favorites, setFavorites] = useState([]);

  // Read the favorites saved from the Markets page (stored in this browser)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setFavorites(parsed);
      }
    } catch (e) {
      // Storage may be unavailable; favorites simply stay empty
    }
  }, []);

  // Match saved favorites such as BTCUSDT with the Home coin list (BTC)
  const favoriteCoins = favorites
    .map((fav) => {
      const base = String(fav).replace(/USDT$/, '');
      const coin = coins.find((c) => c.symbol === base || c.symbol === fav);
      return coin ? { fav, coin } : null;
    })
    .filter(Boolean);

  return (
    <div className="bg-[#2b313a]/20 border border-[#2b313a] rounded-2xl p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-white text-sm">★ My Favorites</h3>
        <Link href="/market" className="text-[#f0b90b] hover:underline font-semibold text-xs">
          Manage →
        </Link>
      </div>

      {favoriteCoins.length === 0 ? (
        <div className="text-gray-500 text-sm">
          No favorites yet. Open Markets and tap the star next to a coin to see it here.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {favoriteCoins.map(({ fav, coin }) => {
            const isUp = String(coin.change).startsWith('+');
            return (
              <Link
                key={fav}
                href={'/market/' + String(fav).toLowerCase()}
                className="block bg-[#181a20] border border-gray-800 hover:border-[#f0b90b] p-3 rounded-xl transition"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white text-sm">{coin.symbol}</span>
                  <span className={isUp ? 'text-[#0ecb81] text-xs' : 'text-red-400 text-xs'}>
                    {coin.change}
                  </span>
                </div>
                <div className="text-white font-semibold mt-1">${coin.price}</div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}