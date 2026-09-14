'use client';
import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/firebase';

export default function SwapPage() {
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('60s');
  const [loading, setLoading] = useState(false);

  const handleTradeAction = async (type) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert('Please login first');
        return;
      }

      if (!amount || Number(amount) <= 0) {
        alert('Please enter a valid amount');
        return;
      }

      setLoading(true);

      await addDoc(collection(db, 'trades'), {
        userId: user.uid,
        userEmail: user.email,
        amount: Number(amount),
        duration: duration,
        type: type,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      alert('Trade placed successfully! Waiting for admin approval.');
      setAmount('');
    } catch (error) {
      console.error('Error placing trade: ', error);
      alert('Failed to place trade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[70vh] text-white">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-xl">
        <h2 className="text-xl font-bold mb-4">Trade Options</h2>

        {/* From Field */}
        <div className="bg-slate-800 p-3 rounded-xl mb-3">
          <span className="text-sm text-gray-400">Amount (USDT)</span>
          <input
            type="number"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-transparent text-2xl outline-none mt-1 text-white"
          />
        </div>

        {/* Duration Selection */}
        <div className="flex gap-2 my-4">
          {['60s', '90s', '120s', '180s', '240s'].map((time) => (
            <button
              key={time}
              onClick={() => setDuration(time)}
              className={`px-3 py-1 rounded-lg ${duration === time ? 'bg-purple-600 text-white' : 'bg-slate-700 text-gray-300'}`}
            >
              {time}
            </button>
          ))}
        </div>

        {/* Buy and Sell Action Buttons */}
        <div className="flex gap-4 mt-4">
          <button 
            onClick={() => handleTradeAction('buy')} 
            disabled={loading}
            className="w-1/2 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold"
          >
            {loading ? 'Processing...' : 'Buy'}
          </button>
          <button 
            onClick={() => handleTradeAction('sell')} 
            disabled={loading}
            className="w-1/2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold"
          >
            {loading ? 'Processing...' : 'Sell'}
          </button>
        </div>
      </div>
    </div>
  );
}