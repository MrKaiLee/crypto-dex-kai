'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

function statusInfo(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'pending') return { label: 'Pending', icon: '⏳', cls: 'text-[#f0b90b]' };
  if (['approved', 'completed', 'success', 'successful', 'confirmed'].includes(s)) {
    return { label: 'Approved', icon: '✅', cls: 'text-[#0ecb81]' };
  }
  if (['rejected', 'declined', 'failed', 'cancelled', 'canceled'].includes(s)) {
    return { label: 'Rejected', icon: '❌', cls: 'text-red-400' };
  }
  return { label: status ? String(status) : 'Unknown', icon: '•', cls: 'text-gray-400' };
}

function toMillis(createdAt) {
  if (createdAt && typeof createdAt.toMillis === 'function') return createdAt.toMillis();
  return Date.now();
}

function formatDate(ms) {
  try {
    return new Date(ms).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return '';
  }
}

export default function RecentActivity({ userId }) {
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!userId) return undefined;

    const toItems = (snap, type) =>
      snap.docs.map((d) => {
        const data = d.data();
        return {
          id: type + '-' + d.id,
          type,
          coin: data.coin || '',
          amount: data.amount,
          estimatedUsd: data.estimatedUsd,
          status: data.status,
          time: toMillis(data.createdAt),
        };
      });

    const onError = (err) => {
      console.error('Recent activity error:', err);
      setError(true);
    };

    const unsubDeposits = onSnapshot(
      query(collection(db, 'deposits'), where('userId', '==', userId)),
      (snap) => {
        setDeposits(toItems(snap, 'deposit'));
        setError(false);
      },
      onError
    );

    const unsubWithdrawals = onSnapshot(
      query(collection(db, 'withdrawals'), where('userId', '==', userId)),
      (snap) => {
        setWithdrawals(toItems(snap, 'withdraw'));
        setError(false);
      },
      onError
    );

    return () => {
      unsubDeposits();
      unsubWithdrawals();
    };
  }, [userId]);

  if (!userId) return null;

  const items = [...deposits, ...withdrawals].sort((a, b) => b.time - a.time).slice(0, 5);

  return (
    <div className="bg-[#2b313a]/20 border border-[#2b313a] rounded-2xl p-4 space-y-3">
      <h3 className="font-bold text-white text-sm">🕘 Recent Activity</h3>

      {error && items.length === 0 && (
        <div className="text-gray-500 text-sm">Activity is temporarily unavailable.</div>
      )}

      {!error && items.length === 0 && (
        <div className="text-gray-500 text-sm">No deposits or withdrawals yet.</div>
      )}

      {items.map((item) => {
        const st = statusInfo(item.status);
        const isDeposit = item.type === 'deposit';
        return (
          <div
            key={item.id}
            className="flex justify-between items-center bg-[#181a20] border border-gray-800 p-3 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{isDeposit ? '💰' : '💸'}</span>
              <div>
                <div className="font-bold text-white text-sm">
                  {isDeposit ? 'Deposit' : 'Withdraw'} {item.amount} {item.coin}
                </div>
                <div className="text-gray-500 text-xs">{formatDate(item.time)}</div>
              </div>
            </div>
            <div className="text-right">
              {typeof item.estimatedUsd === 'number' && (
                <div className="text-white text-sm font-semibold">≈ ${item.estimatedUsd}</div>
              )}
              <div className={'text-xs ' + st.cls}>
                {st.icon} {st.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}