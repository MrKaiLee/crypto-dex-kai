'use client';
import { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import Link from 'next/link';

// Available Cryptos list with mock market prices
const CRYPTO_MARKET = [
  { symbol: 'ETHUSD', name: 'Ethereum / U.S. Dollar', price: 2424.40 },
  { symbol: 'BTCUSD', name: 'Bitcoin / U.S. Dollar', price: 63500.00 },
  { symbol: 'SOLUSD', name: 'Solana / U.S. Dollar', price: 145.20 },
  { symbol: 'XRPUSD', name: 'Ripple / U.S. Dollar', price: 0.58 },
  { symbol: 'ADAUSD', name: 'Cardano / U.S. Dollar', price: 0.39 },
  { symbol: 'DOGEUSD', name: 'Dogecoin / U.S. Dollar', price: 0.11 }
];
// Maps our symbols to CoinGecko's ids so we can fetch live prices
const COINGECKO_IDS = {
  ETHUSD: 'ethereum',
  BTCUSD: 'bitcoin',
  SOLUSD: 'solana',
  XRPUSD: 'ripple',
  ADAUSD: 'cardano',
  DOGEUSD: 'dogecoin',
};
export default function UserTradePage() {
  const [userId, setUserId] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState(CRYPTO_MARKET[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [amount, setAmount] = useState('500');
  const [duration, setDuration] = useState('60s');
  const [leverage, setLeverage] = useState(20);
  const [loading, setLoading] = useState(false);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [selectedTradeDetails, setSelectedTradeDetails] = useState(null);
const [cryptoMarket, setCryptoMarket] = useState(CRYPTO_MARKET);
  // Filter cryptos based on search input
  const filteredCryptos = cryptoMarket.filter(c => 
    c.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fetch real-time trade history for the user
  useEffect(() => {
    if (!userId.trim()) {
      setTradeHistory([]);
      return;
    }

    const q = query(collection(db, 'trades'), where('userId', '==', userId.trim()));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const historyList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTradeHistory(historyList);
    });

    return () => unsubscribe();
  }, [userId]);

  // Fetch live crypto prices from CoinGecko, same source as the Home page
  useEffect(() => {
    const fetchLivePrices = async () => {
      try {
        const ids = Object.values(COINGECKO_IDS).join(',');
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
        );
        const data = await response.json();

        setCryptoMarket((prevList) =>
          prevList.map((coin) => {
            const geckoId = COINGECKO_IDS[coin.symbol];
            if (geckoId && data[geckoId]) {
              return { ...coin, price: data[geckoId].usd };
            }
            return coin;
          })
        );

        setSelectedCrypto((prev) => {
          const geckoId = COINGECKO_IDS[prev.symbol];
          if (geckoId && data[geckoId]) {
            return { ...prev, price: data[geckoId].usd };
          }
          return prev;
        });
      } catch (error) {
        console.error('Failed to fetch live prices:', error);
      }
    };

    fetchLivePrices();
    const interval = setInterval(fetchLivePrices, 15000);
    return () => clearInterval(interval);
  }, []);
  // Realistic profit calculation: for $500 at 60s, profit is around $40, scaling proportionally with amount & duration
  const calculateEstimatedProfit = () => {
    const numAmount = Number(amount || 0);
    const baseSeconds = parseInt(duration) || 60;
    
    // Base formula: $500 gives ~$40 profit for 60s (8% base return, scaled by duration factor)
    const durationMultiplier = baseSeconds / 60;
    const calculatedProfit = (numAmount * 0.08 * durationMultiplier).toFixed(2);
    return calculatedProfit;
  };

  const estimatedProfit = calculateEstimatedProfit();

  const handleTradeSubmit = async (type) => {
    if (!userId.trim() || !amount || Number(amount) <= 0) {
      alert("Please enter a valid User ID and amount!");
      return;
    }

    setLoading(true);
    try {
      const tradeAmount = Number(amount);
      const finalProfit = Number(estimatedProfit);
      const entryPrice = selectedCrypto.price;
      const exitPriceChange = type === 'buy' ? entryPrice * 0.01 : -entryPrice * 0.01;
      const exitPrice = Number((entryPrice + exitPriceChange).toFixed(2));

      await addDoc(collection(db, 'trades'), {
        userId: userId.trim(),
        symbol: selectedCrypto.symbol,
        cryptoName: selectedCrypto.name,
        type: type, // 'buy' or 'sell'
        amount: tradeAmount,
        duration: duration,
        leverage: Number(leverage),
        entryPrice: entryPrice,
        exitPrice: exitPrice,
        profitAmount: finalProfit,
        status: 'pending', // pending, win, loss
        createdAt: serverTimestamp()
      });

      alert(`Trade ${type.toUpperCase()} order submitted successfully!`);
    } catch (error) {
      console.error("Error submitting trade: ", error);
      alert("Failed to submit trade order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      {/* Top Header */}
      <div className="max-w-2xl mx-auto mb-6 flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center space-x-3">
          <span className="bg-blue-500/20 text-blue-400 p-2 rounded-lg font-bold">Ξ {selectedCrypto.symbol}</span>
          <div>
            <p className="text-sm font-semibold">{selectedCrypto.name}</p>
            <p className="text-xs text-slate-400">Price: ${selectedCrypto.price.toLocaleString()}</p>
          </div>
        </div>
        <Link 
          href="/" 
          className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          Back to Home
        </Link>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* User ID Section */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <label className="block text-sm font-medium mb-2 text-slate-400">Enter Your User ID / Email:</label>
          <input 
            type="text" 
            value={userId} 
            onChange={(e) => setUserId(e.target.value)} 
            placeholder="e.g., user@gmail.com"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 font-semibold"
          />
        </div>

        {/* Crypto Search & Selection Panel */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
          <label className="block text-sm font-medium text-slate-400">Select Crypto Asset</label>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search crypto (e.g., BTC, ETH, Solana)..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500 mb-2"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
            {filteredCryptos.map((crypto) => (
              <button
                key={crypto.symbol}
                type="button"
                onClick={() => setSelectedCrypto(crypto)}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  selectedCrypto.symbol === crypto.symbol 
                    ? 'bg-blue-600/20 border-blue-500 text-white' 
                    : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="font-bold text-sm">{crypto.symbol}</span>
                <span className="text-xs text-slate-400">${crypto.price.toLocaleString()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Trading Form Panel */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
          {/* Time / Duration Selection */}
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-400">TIME (SECONDS)</label>
            <div className="grid grid-cols-5 gap-2">
              {['60s', '90s', '120s', '180s', '240s'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDuration(t)}
                  className={`py-2 rounded-lg text-sm font-bold transition ${
                    duration === t ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Selection */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-slate-400">AMOUNT (USDT)</label>
              <span className="text-xs text-slate-500">Realistic P&L Enabled</span>
            </div>
            <input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-xl font-bold focus:outline-none focus:border-blue-500 mb-3"
            />
            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-5 gap-2">
              {[50, 100, 250, 500, 1000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val.toString())}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-md text-xs font-semibold transition"
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Leverage Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-slate-400">Leverage</label>
              <span className="text-purple-400 font-bold">{leverage}x</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="50" 
              value={leverage} 
              onChange={(e) => setLeverage(e.target.value)}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>

          {/* Estimated Profit Preview */}
          <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl flex justify-between items-center text-sm">
            <span className="text-slate-400">Est. Potential Profit:</span>
            <span className="text-emerald-400 font-bold">+${estimatedProfit} USDT</span>
          </div>

          {/* Buy / Sell Action Buttons */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <button 
              type="button"
              disabled={loading}
              onClick={() => handleTradeSubmit('buy')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
            >
              <span>📈 Buy / Long</span>
            </button>
            <button 
              type="button"
              disabled={loading}
              onClick={() => handleTradeSubmit('sell')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
            >
              <span>📉 Sell / Short</span>
            </button>
          </div>
        </div>

        {/* Trade History Section */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <h2 className="text-lg font-semibold mb-4 text-blue-400">Your Trade Orders History</h2>
          
          {!userId.trim() ? (
            <p className="text-slate-400 text-sm">Enter your User ID above to view your history.</p>
          ) : tradeHistory.length === 0 ? (
            <p className="text-slate-400 text-sm">No orders found.</p>
          ) : (
            <div className="space-y-3">
              {tradeHistory.map((trade) => (
                <div 
                  key={trade.id} 
                  onClick={() => setSelectedTradeDetails(trade)}
                  className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex justify-between items-center cursor-pointer hover:border-blue-500 transition"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm uppercase text-slate-200">{trade.symbol}</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${trade.type === 'buy' ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {trade.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Amount: ${trade.amount} | Leverage: {trade.leverage}x | Time: {trade.duration}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase inline-block ${
                      trade.status === 'win' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                      trade.status === 'loss' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                      'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {trade.status === 'win' ? `+$${trade.profitAmount}` : 
                       trade.status === 'loss' ? `-$${trade.amount}` : 
                       'Pending'}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">Click for details</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detailed Trade History Modal */}
      {selectedTradeDetails && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-blue-400">Order Details</h3>
              <button 
                onClick={() => setSelectedTradeDetails(null)}
                className="text-slate-400 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between bg-slate-800/50 p-2.5 rounded-lg">
                <span className="text-slate-400">Crypto Asset:</span>
                <span className="font-bold uppercase">{selectedTradeDetails.symbol}</span>
              </div>
              <div className="flex justify-between bg-slate-800/50 p-2.5 rounded-lg">
                <span className="text-slate-400">Order Type:</span>
                <span className={`font-bold uppercase ${selectedTradeDetails.type === 'buy' ? 'text-purple-400' : 'text-emerald-400'}`}>
                  {selectedTradeDetails.type}
                </span>
              </div>
              <div className="flex justify-between bg-slate-800/50 p-2.5 rounded-lg">
                <span className="text-slate-400">Duration / Time:</span>
                <span className="font-bold">{selectedTradeDetails.duration}</span>
              </div>
              <div className="flex justify-between bg-slate-800/50 p-2.5 rounded-lg">
                <span className="text-slate-400">Amount (USDT):</span>
                <span className="font-bold">${selectedTradeDetails.amount}</span>
              </div>
              <div className="flex justify-between bg-slate-800/50 p-2.5 rounded-lg">
                <span className="text-slate-400">Leverage:</span>
                <span className="font-bold">{selectedTradeDetails.leverage}x</span>
              </div>
              <div className="flex justify-between bg-slate-800/50 p-2.5 rounded-lg">
                <span className="text-slate-400">Entry Price:</span>
                <span className="font-bold">${selectedTradeDetails.entryPrice}</span>
              </div>
              <div className="flex justify-between bg-slate-800/50 p-2.5 rounded-lg">
                <span className="text-slate-400">Exit Price:</span>
                <span className="font-bold">${selectedTradeDetails.exitPrice}</span>
              </div>
              <div className="flex justify-between bg-slate-800/50 p-2.5 rounded-lg">
                <span className="text-slate-400">Outcome Status:</span>
                <span className={`font-bold uppercase ${
                  selectedTradeDetails.status === 'win' ? 'text-green-400' : 
                  selectedTradeDetails.status === 'loss' ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {selectedTradeDetails.status}
                </span>
              </div>
            </div>

            <button 
              onClick={() => setSelectedTradeDetails(null)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition mt-2"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}