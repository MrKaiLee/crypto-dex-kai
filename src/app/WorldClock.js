'use client';

import { useState, useEffect } from 'react';

const ZONES = [
  { label: 'Your time', zone: undefined },
  { label: 'New York', zone: 'America/New_York' },
  { label: 'London', zone: 'Europe/London' },
  { label: 'Tokyo', zone: 'Asia/Tokyo' },
];

function pad(n) {
  return String(n).padStart(2, '0');
}

// Reads hour, minute and second for a time zone (undefined = the visitor's own time zone)
function getClockParts(date, zone) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: zone,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const read = (type) => {
    const part = parts.find((p) => p.type === type);
    return part ? parseInt(part.value, 10) : 0;
  };
  return { h: read('hour') % 24, m: read('minute'), s: read('second') };
}

function Clock({ label, zone, now }) {
  const { h, m, s } = getClockParts(now, zone);
  const hourAngle = (h % 12) * 30 + m * 0.5;
  const minuteAngle = m * 6 + s * 0.1;
  const secondAngle = s * 6;
  const isDay = h >= 6 && h < 18;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        viewBox="0 0 100 100"
        className="w-24 h-24"
        role="img"
        aria-label={label + ' ' + pad(h) + ':' + pad(m)}
      >
        <circle
          cx="50"
          cy="50"
          r="47"
          fill="#181a20"
          stroke="#f0b90b"
          strokeOpacity="0.55"
          strokeWidth="2"
        />

        {Array.from({ length: 12 }, (_, i) => (
          <line
            key={i}
            x1="50"
            y1="8"
            x2="50"
            y2={i % 3 === 0 ? 15 : 12}
            stroke="#848e9c"
            strokeWidth={i % 3 === 0 ? 2 : 1}
            transform={'rotate(' + i * 30 + ' 50 50)'}
          />
        ))}

        <line
          x1="50"
          y1="50"
          x2="50"
          y2="28"
          stroke="#ffffff"
          strokeWidth="3.5"
          strokeLinecap="round"
          transform={'rotate(' + hourAngle + ' 50 50)'}
        />
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="17"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          transform={'rotate(' + minuteAngle + ' 50 50)'}
        />
        <line
          x1="50"
          y1="58"
          x2="50"
          y2="14"
          stroke="#f0b90b"
          strokeWidth="1.2"
          strokeLinecap="round"
          transform={'rotate(' + secondAngle + ' 50 50)'}
        />
        <circle cx="50" cy="50" r="3" fill="#f0b90b" />
      </svg>

      <div className="text-center">
        <div className="text-white text-sm font-semibold">
          {isDay ? '☀️' : '🌙'} {label}
        </div>
        <div className="text-gray-400 text-xs font-mono">
          {pad(h)}:{pad(m)}
        </div>
      </div>
    </div>
  );
}

export default function WorldClock() {
  const [now, setNow] = useState(null);

  // Set the time after mount (avoids server/client mismatch) and tick every second
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!now) return null;

  return (
    <div className="bg-[#2b313a]/20 border border-[#2b313a] rounded-2xl p-4 space-y-3">
      <h3 className="font-bold text-white text-sm">🕒 World Clock</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 justify-items-center">
        {ZONES.map((z) => (
          <Clock key={z.label} label={z.label} zone={z.zone} now={now} />
        ))}
      </div>

      <div className="text-[11px] text-gray-500">
        Times follow each city's local clock, including daylight saving changes.
      </div>
    </div>
  );
}