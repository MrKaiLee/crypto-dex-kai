'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { getExpiryMs, isExpiredPending } from '../../tradeStatus';

const ADMIN_EMAIL = 'maximsupport0@gmail.com';

function toMillis(ts) {
  return ts && typeof ts.toMillis === 'function' ? ts.toMillis() : 0;
}

function formatDate(ms) {
  if (!ms) return '-';
  try {
    return new Date(ms).toLocaleString();
  } catch (e) {
    return '-';
  }
}

export default function TimeoutTrades() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [timedOut, setTimedOut] = useState([]);
  const [pending, setPending] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [filter, setFilter] = useState('unreviewed');
  const [error, setError] = useState('');
  const closingIds = useRef(new Set());

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChecking(false);
    });
    return () => unsub();
  }, []);

  const isAdmin = !!user && user.email === ADMIN_EMAIL;

  // Load trades that were closed by timeout and trades that are still pending
  useEffect(() => {
    if (!isAdmin) return undefined;

    const mapDocs = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const onErr = (e) => {
      console.error('Timeout trades error:', e);
      setError('Could not load trades.');
    };

    const unsubTimedOut = onSnapshot(
      query(collection(db, 'trades'), where('autoClosed', '==', true)),
      (s) => setTimedOut(mapDocs(s)),
      onErr
    );
    const unsubPending = onSnapshot(
      query(collection(db, 'trades'), where('status', '==', 'pending')),
      (s) => setPending(mapDocs(s)),
      onErr
    );

    return () => {
      unsubTimedOut();
      unsubPending();
    };
  }, [isAdmin]);

  // Every 2 seconds: refresh the clock and close pending trades whose duration has passed
  useEffect(() => {
    if (!isAdmin) return undefined;

    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);

      pending.forEach((trade) => {
        if (!isExpiredPending(trade, current)) return;
        if (closingIds.current.has(trade.id)) return;

        closingIds.current.add(trade.id);
        const expiry = getExpiryMs(trade);
        const ref = doc(db, 'trades', trade.id);

        runTransaction(db, async (tx) => {
          const snap = await tx.get(ref);
          if (!snap.exists() || snap.data().status !== 'pending') return;
          tx.update(ref, {
            status: 'loss',
            closedAt: Timestamp.fromMillis(expiry),
            autoClosed: true,
            closeReason: 'timeout',
          });
        }).catch((e) => {
          console.warn('Auto close skipped:', e.message);
          setTimeout(() => closingIds.current.delete(trade.id), 10000);
        });
      });
    }, 2000);

    return () => clearInterval(timer);
  }, [isAdmin, pending]);

  async function markReviewed(id) {
    setError('');
    try {
      await updateDoc(doc(db, 'trades', id), {
        reviewed: true,
        reviewedAt: serverTimestamp(),
        reviewedBy: user.email,
      });
    } catch (e) {
      console.error(e);
      setError('Update failed.');
    }
  }

  if (checking) {
    return <div className="min-h-screen bg-[#181a20] text-gray-400 p-6">Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#181a20] text-gray-300 p-6 space-y-4">
        <div>Access denied. Please log in with the admin account.</div>
        <Link href="/" className="inline-block bg-[#2b313a] text-white px-4 py-2 rounded-xl">
          Back
        </Link>
      </div>
    );
  }

  // Build the list: expired pending trades (about to be saved) + saved timeout trades
  const rowsMap = new Map();
  pending.forEach((t) => {
    if (isExpiredPending(t, now)) {
      rowsMap.set(t.id, { ...t, derived: true, closedAtMs: getExpiryMs(t) });
    }
  });
  timedOut.forEach((t) => {
    rowsMap.set(t.id, { ...t, derived: false, closedAtMs: toMillis(t.closedAt) });
  });

  const allRows = Array.from(rowsMap.values()).sort((a, b) => b.closedAtMs - a.closedAtMs);
  const unreviewedCount = allRows.filter((t) => !t.reviewed).length;
  const rows = allRows.filter((t) => filter === 'all' || !t.reviewed).slice(0, 100);
  const waitingCount = pending.filter((t) => !isExpiredPending(t, now)).length;

  return (
    <div className="min-h-screen bg-[#181a20] text-white p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <h1 className="text-xl font-bold">Timeout Trades (auto Loss)</h1>
          <Link href="/" className="bg-[#2b313a] text-white text-sm px-4 py-2 rounded-xl">
            Back
          </Link>
        </div>

        <div className="bg-[#2b313a]/30 border border-[#2b313a] text-gray-400 text-xs p-3 rounded-xl">
          Trades that passed their duration without an admin decision are closed as Loss. Adjust the user balance in
          User Management, then mark the trade as reviewed. Pending trades still within their time: {waitingCount}.
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilter('unreviewed')}
            className={'px-4 py-2 rounded-xl text-sm font-bold cursor-pointer ' + (filter === 'unreviewed' ? 'bg-[#f0b90b] text-black' : 'bg-[#2b313a] text-white')}
          >
            Unreviewed ({unreviewedCount})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={'px-4 py-2 rounded-xl text-sm font-bold cursor-pointer ' + (filter === 'all' ? 'bg-[#f0b90b] text-black' : 'bg-[#2b313a] text-white')}
          >
            All ({allRows.length})
          </button>
        </div>

        {error && <div className="text-red-400 text-sm">{error}</div>}
        {rows.length === 0 && <div className="text-gray-500 text-sm">No timeout trades to show.</div>}

        <div className="space-y-3">
          {rows.map((t) => (
            <div key={t.id} className="bg-[#2b313a]/20 border border-[#2b313a] rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-start gap-3 flex-wrap">
                <div>
                  <div className="font-bold text-sm uppercase">
                    {t.symbol} {t.type}
                  </div>
                  <div className="text-blue-400 text-sm font-semibold">{t.userEmail || t.userId}</div>
                  <div className="text-gray-500 text-[11px] break-all">ID: {t.userId}</div>
                </div>
                <div className="text-right">
                  <div className="text-red-400 font-bold">-${t.amount}</div>
                  <div className="text-[11px] text-red-400">Loss (timeout)</div>
                </div>
              </div>

              <div className="text-xs text-gray-400">
                Amount: ${t.amount} | Leverage: {t.leverage}x | Duration: {t.duration}
              </div>
              <div className="text-xs text-gray-400">
                Opened: {formatDate(toMillis(t.createdAt))} | Closed: {formatDate(t.closedAtMs)}
              </div>
              <div className="text-[11px] text-gray-500">
                Order ID: #{String(t.id).slice(-6).toUpperCase()}
              </div>

              <div className="pt-1">
                {t.reviewed ? (
                  <span className="text-xs text-[#0ecb81]">Reviewed</span>
                ) : t.derived ? (
                  <span className="text-xs text-gray-500">Saving...</span>
                ) : (
                  <button
                    onClick={() => markReviewed(t.id)}
                    className="bg-[#0ecb81] hover:bg-[#0bb673] text-black font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
                  >
                    Mark reviewed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}