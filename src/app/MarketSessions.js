'use client';

import { useState, useEffect } from 'react';

// Session hours in UTC (approximate; they shift by an hour with daylight saving time)
const SESSIONS = [
  { name: 'Sydney', flag: '🇦🇺', start: 22, end: 7 },
  { name: 'Tokyo', flag: '🇯🇵', start: 0, end: 9 },
  { name: 'London', flag: '🇬🇧', start: 8, end: 17 },
  { name: 'New York', flag: '🇺🇸', start: 13, end: 22 },
];

function pad(n) {
  return String(n).padStart(2, '0');
}

function isSessionOpen(session, hour) {
  if (session.start < session.end) {
    return hour >= session.start && hour < session.end;
  }
  // Sessions that continue past midnight
  return hour >= session.start || hour < session.end;
}

export default function MarketSessions() {
  const [now, setNow] = useState(null);

  // Set the time after mount (avoids server/client mismatch) and refresh every 30 seconds
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  if (!now) return null;

  const utcDay = now.getUTCDay();
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();

  // Forex is closed from Friday 22:00 UTC until Sunday 22:00 UTC
  const weekendClosed =
    utcDay === 6 || (utcDay === 5 && utcHour >= 22) || (utcDay === 0 && utcHour < 22);

  const statuses = SESSIONS.map((s) => ({
    ...s,
    open: !weekendClosed && isSessionOpen(s, utcHour),
  }));

  const londonOpen = statuses.find((s) => s.name === 'London').open;
  const newYorkOpen = statuses.find((s) => s.name === 'New York').open;
  const overlap = londonOpen && newYorkOpen;

  let note = 'Crypto trades 24/7, but activity usually rises when the big forex sessions are open.';
  if (weekendClosed) {
    note = 'Forex markets are closed for the weekend. Crypto keeps trading 24/7.';
  } else if (overlap) {
    note = 'London and New York are both open: usually the most active period of the day.';
  }

  return (
    <div className="bg-[#2b313a]/20 border border-[#2b313a] rounded-2xl p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-white text-sm">🌍 Forex Market Sessions</h3>
        <span className="text-[11px] text-gray-400 font-mono">
          UTC {pad(utcHour)}:{pad(utcMinute)}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statuses.map((s) => (
          <div
            key={s.name}
            className={
              'rounded-xl p-3 border transition ' +
              (s.open
                ? 'bg-[#0ecb81]/10 border-[#0ecb81]/40'
                : 'bg-[#181a20] border-gray-800 opacity-70')
            }
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{s.flag}</span>
              <span className="font-bold text-white text-sm">{s.name}</span>
            </div>
            <div className="text-[11px] text-gray-500 mt-1">
              {pad(s.start)}:00 - {pad(s.end)}:00 UTC
            </div>
            <div
              className={
                'mt-2 inline-flex items-center gap-1.5 text-xs font-semibold ' +
                (s.open ? 'text-[#0ecb81]' : 'text-gray-500')
              }
            >
              <span
                className={
                  'w-2 h-2 rounded-full ' + (s.open ? 'bg-[#0ecb81] animate-pulse' : 'bg-gray-600')
                }
              />
              {s.open ? 'Open' : 'Closed'}
            </div>
          </div>
        ))}
      </div>

      <div className="text-[11px] text-gray-500">{note}</div>
    </div>
  );
}