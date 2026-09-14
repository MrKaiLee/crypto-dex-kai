'use client';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';

export default function AdminTrades() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listening to trades collection from Firebase
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

  const handleTradeAction = async (tradeId, userId, amount, type, status) => {
    if (status !== 'pending') {
      alert("This trade has already been processed!");
      return;
    }

    const action = confirm(`Do you want to APPROVE this trade? Click Cancel to REJECT.`);
    
    try {
      const tradeRef = doc(db, 'trades', tradeId);
      const userRef = doc(db, 'users', userId);

      if (action) {
        // If approved, update trade status to approved and update user balance accordingly
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const currentBalance = userSnap.data().balance || 0;
          let newBalance = currentBalance;

          // If it's a buy/deposit type, add to balance; if sell/withdraw, subtract
          if (type === 'buy' || type === 'deposit') {
            newBalance += Number(amount);
          } else if (type === 'sell' || type === 'withdraw') {
            newBalance -= Number(amount);
          }

          await updateDoc(userRef, { balance: newBalance });
        }

        await updateDoc(tradeRef, { status: 'approved' });
        alert("Trade approved and user balance updated successfully!");
      } else {
        // If rejected
        await updateDoc(tradeRef, { status: 'rejected' });
        alert("Trade rejected successfully!");
      }
    } catch (error) {
      console.error("Error processing trade: ", error);
      alert("Failed to process trade");
    }
  };

  return (
    <div className="p-8 text-white min-h-screen bg-slate-950">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard - Pending Trades</h1>
        <a 
          href="/admin" 
          className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-semibold"
        >
          Back to User Management
        </a>
      </div>

      {loading ? (
        <p>Loading trades...</p>
      ) : trades.length === 0 ? (
        <p className="text-slate-400">No trades found.</p>
      ) : (
        <div className="grid gap-4">
          {trades.map((trade) => (
            <div key={trade.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
              <div>
                <p><strong>User ID:</strong> {trade.userId}</p>
                <p><strong>Type:</strong> <span className="uppercase text-blue-400">{trade.type}</span></p>
                <p><strong>Amount:</strong> ${trade.amount}</p>
                <p><strong>Status:</strong> <span className={`font-bold ${trade.status === 'approved' ? 'text-green-400' : trade.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'}`}>{trade.status || 'pending'}</span></p>
              </div>
              <div>
                <button
                  onClick={() => handleTradeAction(trade.id, trade.userId, trade.amount, trade.type, trade.status || 'pending')}
                  className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg font-bold text-sm"
                >
                  Review Trade
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}