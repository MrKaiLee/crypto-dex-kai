'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

const CHECKS = [
  { id: 'password', label: 'I use a strong password that I do not use anywhere else' },
  { id: 'secrets', label: 'I never share my password or recovery phrase with anyone' },
  { id: 'addresses', label: 'I double-check wallet addresses before withdrawing' },
  { id: 'devices', label: 'I sign out when I use a shared or public device' },
];

const TOTAL_ITEMS = CHECKS.length + 1;
const RADIUS = 34;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function storageKey(uid) {
  return 'security_checks_' + uid;
}

export default function SecurityCenter() {
  const [user, setUser] = useState(null);
  const [verified, setVerified] = useState(false);
  const [checks, setChecks] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setVerified(!!(u && u.emailVerified));
      if (u) {
        try {
          const saved = localStorage.getItem(storageKey(u.uid));
          setChecks(saved ? JSON.parse(saved) : {});
        } catch (e) {
          setChecks({});
        }
      } else {
        setChecks({});
      }
    });
    return () => unsub();
  }, []);

  function toggleCheck(id) {
    if (!user) return;
    const next = { ...checks, [id]: !checks[id] };
    setChecks(next);
    try {
      localStorage.setItem(storageKey(user.uid), JSON.stringify(next));
    } catch (e) {
      // Ignore storage errors; the tick simply is not remembered
    }
  }

  async function sendVerification() {
    if (!user) return;
    setBusy(true);
    setMessage('');
    try {
      await sendEmailVerification(user);
      setMessage('Verification email sent. Open the link in your inbox (check spam too), then press "Check again".');
    } catch (e) {
      setMessage(
        e && e.code === 'auth/too-many-requests'
          ? 'Too many requests. Please wait a few minutes and try again.'
          : 'Could not send the email. Please try again later.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function recheck() {
    if (!auth.currentUser) return;
    setBusy(true);
    try {
      await auth.currentUser.reload();
      const isVerified = !!auth.currentUser.emailVerified;
      setVerified(isVerified);
      setMessage(isVerified ? 'Email verified. Thank you!' : 'Your email is not verified yet.');
    } catch (e) {
      setMessage('Could not check the status. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function sendReset() {
    if (!user || !user.email) return;
    setBusy(true);
    setMessage('');
    try {
      await sendPasswordResetEmail(auth, user.email);
      setMessage('Password reset email sent to ' + user.email + '. Check your inbox (and spam).');
    } catch (e) {
      setMessage(
        e && e.code === 'auth/too-many-requests'
          ? 'Too many requests. Please wait a few minutes and try again.'
          : 'Could not send the email. Please try again later.'
      );
    } finally {
      setBusy(false);
    }
  }

  if (!user) return null;

  const doneCount = (verified ? 1 : 0) + CHECKS.filter((c) => checks[c.id]).length;
  const percent = Math.round((doneCount / TOTAL_ITEMS) * 100);
  const allDone = doneCount === TOTAL_ITEMS;

  let level = 'Low';
  let levelClass = 'text-[#f6465d]';
  let ringColor = '#f6465d';
  if (percent >= 80) {
    level = 'High';
    levelClass = 'text-[#0ecb81]';
    ringColor = '#0ecb81';
  } else if (percent >= 40) {
    level = 'Medium';
    levelClass = 'text-[#f0b90b]';
    ringColor = '#f0b90b';
  }

  const filled = (percent / 100) * CIRCUMFERENCE;
  const showList = expanded && !allDone ? true : expanded && allDone;

  return (
    <div className="bg-[#2b313a]/20 border border-[#2b313a] rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 80 80" className="w-full h-full">
            <circle cx="40" cy="40" r={RADIUS} fill="none" stroke="#2b313a" strokeWidth="8" />
            <circle
              cx="40"
              cy="40"
              r={RADIUS}
              fill="none"
              stroke={ringColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={filled + ' ' + (CIRCUMFERENCE - filled)}
              transform="rotate(-90 40 40)"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
            {percent}%
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-sm">🔐 Account Security</h3>
          <div className="text-xs text-gray-400">
            Security level: <span className={'font-bold ' + levelClass}>{level}</span>
            {allDone ? ' ✓' : ''}
          </div>
          <div className="text-[11px] text-gray-500">
            {allDone
              ? 'Great, all recommended steps are done.'
              : doneCount + ' of ' + TOTAL_ITEMS + ' steps done. Complete the list to raise your level.'}
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[#f0b90b] hover:underline font-semibold text-xs cursor-pointer shrink-0"
        >
          {showList ? 'Hide' : 'Review'}
        </button>
      </div>

      {showList && (
        <div className="space-y-2">
          <div className="bg-[#181a20] border border-gray-800 rounded-xl p-3 space-y-2">
            <div className="flex items-start gap-3">
              <span className={'text-lg leading-none ' + (verified ? 'text-[#0ecb81]' : 'text-gray-600')}>
                {verified ? '✓' : '○'}
              </span>
              <div className="flex-1">
                <div className="text-white text-sm">Email address verified</div>
                <div className="text-[11px] text-gray-500">{user.email}</div>
              </div>
            </div>
            {!verified && (
              <div className="flex gap-2 flex-wrap pl-7">
                <button
                  onClick={sendVerification}
                  disabled={busy}
                  className="bg-[#f0b90b] hover:bg-[#d9a70a] text-black font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  Verify email
                </button>
                <button
                  onClick={recheck}
                  disabled={busy}
                  className="bg-[#2b313a] hover:bg-[#363c4e] text-white font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  Check again
                </button>
              </div>
            )}
          </div>

          {CHECKS.map((item) => (
            <div key={item.id} className="bg-[#181a20] border border-gray-800 rounded-xl p-3 space-y-2">
              <button
                onClick={() => toggleCheck(item.id)}
                className="w-full flex items-start gap-3 text-left cursor-pointer"
              >
                <span className={'text-lg leading-none ' + (checks[item.id] ? 'text-[#0ecb81]' : 'text-gray-600')}>
                  {checks[item.id] ? '✓' : '○'}
                </span>
                <span className="text-white text-sm">{item.label}</span>
              </button>
              {item.id === 'password' && (
                <div className="pl-7">
                  <button
                    onClick={sendReset}
                    disabled={busy}
                    className="bg-[#2b313a] hover:bg-[#363c4e] text-white font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer"
                  >
                    Send password reset email
                  </button>
                </div>
              )}
            </div>
          ))}

          {message && (
            <div className="text-xs text-gray-300 bg-[#f0b90b]/10 border border-[#f0b90b]/30 rounded-xl p-3">
              {message}
            </div>
          )}

          <div className="text-[10px] text-gray-600">
            Tick each habit once you follow it. Your ticks are saved on this device only.
          </div>
        </div>
      )}
    </div>
  );
}