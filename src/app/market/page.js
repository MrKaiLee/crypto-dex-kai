'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function MarketPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const cryptoList = [
    { name: 'Bitcoin', symbol: 'BTCUSDT', price: '75,531.90', change: '-0.15%' },
    { name: 'Ethereum', symbol: 'ETHUSDT', price: '2,391.90', change: '-0.27%' },
    { name: 'BNB', symbol: 'BNBUSDT', price: '706.14', change: '-0.83%' },
    { name: 'Solana', symbol: 'SOLUSDT', price: '96.70', change: '-0.20%' },
    { name: 'XRP', symbol: 'XRPUSDT', price: '1.2793', change: '-0.31%' },
    { name: 'Cardano', symbol: 'ADAUSDT', price: '0.1927', change: '-1.38%' },
    { name: 'Dogecoin', symbol: 'DOGEUSDT', price: '0.07928', change: '-1.00%' },
  ];

  const filteredCoins = cryptoList.filter(coin => 
    coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      <div className="flex justify-between items-center mb-6">
        <Link href="/" className="text-sm bg-slate-800 px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-700">
          ← Back to Home
        </Link>
        <h1 className="text-xl font-bold">Markets</h1>
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

      <div className="space-y-3">
        {filteredCoins.map((coin) => (
          <Link key={coin.symbol} href={`/market/${coin.symbol.toLowerCase()}`}>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center hover:border-slate-700 transition">
              <div>
                <p className="font-bold">{coin.symbol}</p>
                <p className="text-sm text-slate-400">{coin.name}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{coin.price}</p>
                <p className="text-sm text-red-400">{coin.change}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}