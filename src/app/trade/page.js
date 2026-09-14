'use client';
import { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import Link from 'next/link';

export default function UserTradePage() {
  const [type, setType] = useState('buy');
  const [amount, setAmount] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [tradeHistory, setTradeHistory] = useState([]);

  // Fetch trade history whenever userId changes
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId || !amount) {
      alert("Please fill in all fields!");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'trades'), {
        userId: userId.trim(),
        type: type,
        amount: Number(amount),
        status: 'pending',
        createdAt: serverTimestamp()
      });

      alert("Trade request submitted successfully! Waiting for admin approval.");
      setAmount('');
    } catch (error) {
      console.error("Error submitting trade: ", error);
      alert("Failed to submit trade request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-xl mx-auto mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Crypto Trade Portal</h1>
        <Link 
          href="/" 
          className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          Back to Home
        </Link>
      </div>

      <div className="max-w-xl mx-auto space-y-8">
        {/* Trade Submission Form */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">New Trade Request</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-400">User ID / Email</label>
              <input 
                type="text" 
                value={userId} 
                onChange={(e) => setUserId(e.target.value)} 
                placeholder="Enter your User ID to view history & trade"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-400">Trade Type</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="buy">Buy / Deposit</option>
                <option value="sell">Sell / Withdraw</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-400">Amount ($)</label>
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                placeholder="0.00"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-lg transition duration-200 mt-2"
            >
              {loading ? "Submitting..." : "Submit Trade Request"}
            </button>
          </form>
        </div>

        {/* Trade History Section */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">Your Trade History</h2>
          
          {!userId.trim() ? (
            <p className="text-slate-400 text-sm">Please enter your User ID above to see your trade history.</p>
          ) : tradeHistory.length === 0 ? (
            <p className="text-slate-400 text-sm">No trade history found for this ID.</p>
          ) : (
            <div className="space-y-3">
              {tradeHistory.map((trade) => (
                <div key={trade.id} className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold uppercase text-slate-200">
                      {trade.type} - <span className="text-blue-400">${trade.amount}</span>
                    </p>
                    <p className="text-xs text-slate-400">ID: {trade.id}</p>
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      trade.status === 'approved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                      trade.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                      'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {trade.status || 'pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}