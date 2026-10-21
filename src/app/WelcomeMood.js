'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

function getGreeting(hour) {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 22) return 'Good evening';
  return 'Welcome back';
}

// Turns strings like "-1.25%" or "+0.40%" into numbers
function toNumber(value) {
  const n = parseFloat(String(value).replace(/,/g, '').replace('%', '').replace('+', ''));
  return Number.isNaN(n) ? 0 : n;
}

export default function WelcomeMood({ coins = [] }) {
  const [name, setName] = useState('');
  const [greeting, setGreeting] = useState('Welcome');
  const [dateText, setDateText] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setName(u && u.email ? u.email.split('@')[0] : '');
    });
    return () => unsub();
  }, []);

  // Set greeting and date after mount (avoids server/client mismatch) and refresh every minute
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setGreeting(getGreeting(now.getHours()));
      setDateText(
        now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
      );
    };
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, []);

  // Stablecoins such as USDT barely move, so they are left out of the mood
const movers = coins.filter((c) => c.symbol !== 'USDT');
const up = movers.filter((c) => toNumber(c.change) > 0).length;
const down = movers.filter((c) => toNumber(c.change) < 0).length;
  const total = up + down;
  const upPercent = total === 0 ? 50 : Math.round((up / total) * 100);

  let mood = 'Mixed';
  let moodClass = 'text-yellow-400';
  if (total > 0 && upPercent >= 60) {
    mood = 'Bullish';
    moodClass = 'text-[#0ecb81]';
  } else if (total > 0 && upPercent <= 40) {
    mood = 'Bearish';
    moodClass = 'text-red-400';
  }

  return (
    <div className="bg-gradient-to-r from-[#f0b90b]/10 via-[#2b313a]/30 to-[#1e2329] border border-[#2b313a] rounded-2xl p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-gray-400 text-xs">{dateText}</div>
          <div className="text-white text-lg font-bold">
            {greeting}
            {name ? ', ' : ''}
            <span className="text-[#f0b90b]">{name}</span> 👋
          </div>
        </div>

        <div className="md:w-72 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Market mood</span>
            <span className={'font-bold ' + moodClass}>{mood}</span>
          </div>
          <div className="h-2 rounded-full bg-red-500/60 overflow-hidden">
            <div
              className="h-full bg-[#0ecb81] transition-all duration-700"
              style={{ width: upPercent + '%' }}
            />
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-[#0ecb81]">▲ {up} up</span>
            <span className="text-red-400">▼ {down} down</span>
          </div>
        </div>
      </div>
    </div>
  );
}