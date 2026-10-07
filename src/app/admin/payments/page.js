'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../../firebase';

const ADMIN_EMAIL = 'maximsupport0@gmail.com';

function toMillis(ts) {
  return ts && typeof ts.toMillis === 'function' ? ts.toMillis() : 0;
}

function formatDate(ms) {
  if (!ms) return '';
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

function statusClass(status) {
  if (status === 'pending') return 'text-[#f0b90b]';
  if (status === 'approved') return 'text-[#0ecb81]';
  if (status === 'rejected') return 'text-red-400';
  return 'text-gray-400';
}

export default function PaymentsAdmin() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState('deposits');
  const [filter, setFilter] = useState('pending');
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChecking(false);
    });
    return () => unsub();
  }, []);

  const isAdmin = !!user && user.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!isAdmin) return undefined;

    const mapDocs = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const onErr = (e) => {
      console.error('Payments admin error:', e);
      setError('Could not load requests.');
    };

    const unsubDeposits = onSnapshot(collection(db, 'deposits'), (s) => setDeposits(mapDocs(s)), onErr);
    const unsubWithdrawals = onSnapshot(collection(db, 'withdrawals'), (s) => setWithdrawals(mapDocs(s)), onErr);

    return () => {
      unsubDeposits();
      unsubWithdrawals();
    };
  }, [isAdmin]);

  async function review(collectionName, id, newStatus) {
    const label = newStatus === 'approved' ? 'Approve' : 'Reject';
    if (!window.confirm(label + ' this request?')) return;

    setBusyId(id);
    setError('');
    try {
      const ref = doc(db, collectionName, id);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error('Request not found');
        if (snap.data().status !== 'pending') throw new Error('This request was already reviewed');
        tx.update(ref, {
          status: newStatus,
          reviewedAt: serverTimestamp(),
          reviewedBy: user.email,
        });
      });
    } catch (e) {
      console.error(e);
      setError(e.message || 'Update failed');
    } finally {
      setBusyId('');
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

  const isDepositTab = tab === 'deposits';
  const collectionName = isDepositTab ? 'deposits' : 'withdrawals';
  const source = isDepositTab ? deposits : withdrawals;

  const rows = source
    .filter((r) => filter === 'all' || r.status === 'pending')
    .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
    .slice(0, 100);

  const pendingCount = (list) => list.filter((r) => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#181a20] text-white p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <h1 className="text-xl font-bold">Deposit and Withdraw Requests</h1>
          <Link href="/" className="bg-[#2b313a] text-white text-sm px-4 py-2 rounded-xl">
            Back
          </Link>
        </div>

        <div className="bg-[#2b313a]/30 border border-[#2b313a] text-gray-400 text-xs p-3 rounded-xl">
          Approving or rejecting only changes the request status. Update the user balance separately in User Management.
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setTab('deposits')}
            className={'px-4 py-2 rounded-xl text-sm font-bold cursor-pointer ' + (isDepositTab ? 'bg-[#f0b90b] text-black' : 'bg-[#2b313a] text-white')}
          >
            Deposits ({pendingCount(deposits)} pending)
          </button>
          <button
            onClick={() => setTab('withdrawals')}
            className={'px-4 py-2 rounded-xl text-sm font-bold cursor-pointer ' + (!isDepositTab ? 'bg-[#f0b90b] text-black' : 'bg-[#2b313a] text-white')}
          >
            Withdrawals ({pendingCount(withdrawals)} pending)
          </button>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => setFilter('pending')}
              className={'px-3 py-2 rounded-xl text-xs cursor-pointer ' + (filter === 'pending' ? 'bg-[#363c4e] text-white' : 'bg-[#2b313a] text-gray-400')}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('all')}
              className={'px-3 py-2 rounded-xl text-xs cursor-pointer ' + (filter === 'all' ? 'bg-[#363c4e] text-white' : 'bg-[#2b313a] text-gray-400')}
            >
              All
            </button>
          </div>
        </div>

        {error && <div className="text-red-400 text-sm">{error}</div>}

        {rows.length === 0 && <div className="text-gray-500 text-sm">No requests to show.</div>}

        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="bg-[#2b313a]/20 border border-[#2b313a] rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-start gap-3 flex-wrap">
                <div>
                  <div className="font-bold text-sm">
                    {isDepositTab ? 'Deposit' : 'Withdraw'} {r.amount} {r.coin}
                  </div>
                  <div className="text-gray-400 text-xs">{r.userEmail}</div>
                  <div className="text-gray-500 text-xs">{formatDate(toMillis(r.createdAt))}</div>
                </div>
                <div className="text-right">
                  {typeof r.estimatedUsd === 'number' && (
                    <div className="font-semibold text-sm">≈ ${r.estimatedUsd}</div>
                  )}
                  <div className={'text-xs ' + statusClass(r.status)}>{r.status}</div>
                </div>
              </div>

              {!isDepositTab && r.address && (
                <div className="text-gray-400 text-xs break-all">Address: {r.address}</div>
              )}

              {r.status === 'pending' && (
                <div className="flex gap-2 pt-1">
                  <button
                    disabled={busyId === r.id}
                    onClick={() => review(collectionName, r.id, 'approved')}
                    className="bg-[#0ecb81] hover:bg-[#0bb673] text-black font-bold text-sm px-4 py-2 rounded-xl cursor-pointer"
                  >
                    Approve
                  </button>
                  <button
                    disabled={busyId === r.id}
                    onClick={() => review(collectionName, r.id, 'rejected')}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold text-sm px-4 py-2 rounded-xl cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}