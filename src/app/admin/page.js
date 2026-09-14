'use client';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/firebase';

export default function AdminDashboard() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'trades'), where('status', '==', 'pending'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tradesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTrades(tradesList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleResolveTrade = async (tradeId, userId, amount, outcome) => {
    try {
      const tradeRef = doc(db, 'trades', tradeId);
      const userRef = doc(db, 'users', userId);

      if (outcome === 'win') {
        const profit = amount * 1.8;
        
        await updateDoc(tradeRef, { status: 'win' });
        await updateDoc(userRef, { balance: increment(profit) });
        
        alert('Trade marked as WIN and balance updated successfully!');
      } else {
        await updateDoc(tradeRef, { status: 'loss' });
        alert('Trade marked as LOSS.');
      }
    } catch (error) {
      console.error('Error resolving trade: ', error);
      alert('Failed to resolve trade');
    }
  };

  return (
    <div className="p-8 text-white min-h-screen bg-slate-950">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard - Pending Trades</h1>

      {loading ? (
        <p>Loading pending trades...</p>
      ) : trades.length === 0 ? (
        <p className="text-gray-400">No pending trades available.</p>
      ) : (
        <div className="grid gap-4">
          {trades.map((trade) => (
            <div key={trade.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
              <div>
                <p><strong>User:</strong> {trade.userEmail || trade.userId}</p>
                <p><strong>Amount:</strong> {trade.amount} USDT</p>
                <p><strong>Type:</strong> <span className={trade.type === 'buy' ? 'text-purple-400 font-bold' : 'text-green-400 font-bold'}>{trade.type.toUpperCase()}</span></p>
                <p><strong>Duration:</strong> {trade.duration}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleResolveTrade(trade.id, trade.userId, trade.amount, 'win')}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-bold"
                >
                  Approve (Win)
                </button>
                <button
                  onClick={() => handleResolveTrade(trade.id, trade.userId, trade.amount, 'loss')}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-bold"
                >
                  Reject (Loss)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}