'use client';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';

export default function AdminTrades() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listening to trades collection from Firebase in real-time
    const unsubscribe = onSnapshot(collection(db, 'trades'), (snapshot) => {
      const tradesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTrades(tradesList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Function for admin to update trade status to approved, win, or loss
  const handleTradeAction = async (tradeId, newStatus) => {
    try {
      const tradeRef = doc(db, 'trades', tradeId);
      await updateDoc(tradeRef, {
        status: newStatus // 'approved', 'win', or 'loss'
      });
      alert(`Trade status updated to ${newStatus.toUpperCase()} successfully!`);
    } catch (error) {
      console.error("Error updating trade status: ", error);
      alert("Failed to update trade status.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-8">
      <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold text-blue-400">Admin Trade Management</h1>
          <p className="text-sm text-slate-400 mt-1">Review user trade requests, set Win or Loss outcomes.</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/25 px-4 py-2 rounded-xl text-blue-400 text-sm font-bold">
          Total Orders: {trades.length}
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {loading ? (
          <p className="text-slate-400 text-center py-8">Loading trades...</p>
        ) : trades.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No trade requests found.</p>
        ) : (
          <div className="space-y-4">
            {trades.map((trade) => (
              <div key={trade.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-base uppercase text-white">{trade.symbol || 'ETHUSD'}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded font-bold uppercase ${trade.type === 'buy' ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {trade.type}
                    </span>
                    <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase ${
                      trade.status === 'win' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                      trade.status === 'loss' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                      trade.status === 'approved' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {trade.status || 'pending'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300">
                    User: <span className="font-semibold text-blue-400">{trade.userId}</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    Amount: <span className="text-white font-bold">${trade.amount}</span> | Leverage: <span className="text-white font-bold">{trade.leverage}x</span> | Duration: <span className="text-white font-bold">{trade.duration}</span>
                  </p>
                  <p className="text-[10px] text-slate-500">Order ID: {trade.id}</p>
                </div>

                {/* Admin Action Buttons: Win, Loss, or Approve */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <button 
                    onClick={() => handleTradeAction(trade.id, 'win')}
                    className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-md"
                  >
                    Set Win 🟢
                  </button>
                  <button 
                    onClick={() => handleTradeAction(trade.id, 'loss')}
                    className="flex-1 md:flex-none bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-md"
                  >
                    Set Loss 🔴
                  </button>
                  <button 
                    onClick={() => handleTradeAction(trade.id, 'approved')}
                    className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl transition"
                  >
                    Approve 🔵
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}