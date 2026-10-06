'use client';

import { useState, useEffect } from 'react';

const CURRENCIES = [
  { code: 'EUR', flag: '🇪🇺', name: 'Euro', decimals: 4 },
  { code: 'GBP', flag: '🇬🇧', name: 'British Pound', decimals: 4 },
  { code: 'JPY', flag: '🇯🇵', name: 'Japanese Yen', decimals: 2 },
  { code: 'CHF', flag: '🇨🇭', name: 'Swiss Franc', decimals: 4 },
  { code: 'CAD', flag: '🇨🇦', name: 'Canadian Dollar', decimals: 4 },
  { code: 'AUD', flag: '🇦🇺', name: 'Australian Dollar', decimals: 4 },
];

export default function ForexRates() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/forex');
        if (!res.ok) throw new Error('Bad response');
        const json = await res.json();
        if (!cancelled) {
          setData(json);
          setError(false);
        }
      } catch (e) {
        if (!cancelled) setError(true);
      }
    }

    load();
    const timer = setInterval(load, 10 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="bg-[#2b313a]/20 border border-[#2b313a] rounded-2xl p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-white text-sm">💱 Forex Rates (1 USD =)</h3>
        <span className="text-gray-500 text-xs">
          {data && data.date ? 'Updated daily · ' + data.date : 'Updated daily'}
        </span>
      </div>

      {!data && !error && <div className="text-gray-500 text-sm">Loading rates...</div>}
      {error && !data && <div className="text-gray-500 text-sm">Rates are temporarily unavailable.</div>}

      {data && data.rates && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {CURRENCIES.map((cur) => {
            const rate = data.rates[cur.code];
            if (typeof rate !== 'number') return null;
            return (
              <div key={cur.code} className="bg-[#181a20] border border-gray-800 p-3 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{cur.flag}</span>
                  <span className="font-bold text-white text-sm">{cur.code}</span>
                </div>
                <div className="text-white font-semibold">{rate.toFixed(cur.decimals)}</div>
                <div className="text-gray-500 text-xs">{cur.name}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}