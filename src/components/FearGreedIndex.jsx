'use client';
import React, { useState, useEffect } from 'react';

const SEGMENTS = [
  { from: 0, to: 25, color: '#ea3943' },
  { from: 25, to: 45, color: '#ea8c00' },
  { from: 45, to: 55, color: '#f3d42f' },
  { from: 55, to: 75, color: '#93d900' },
  { from: 75, to: 100, color: '#16c784' },
];

const CX = 100;
const CY = 100;
const RADIUS = 80;

// Converts a 0-100 value to a point on the half-circle gauge
function pointAt(value, radius) {
  const angle = ((180 - value * 1.8) * Math.PI) / 180;
  return { x: CX + radius * Math.cos(angle), y: CY - radius * Math.sin(angle) };
}

function arcPath(from, to) {
  const start = pointAt(from, RADIUS);
  const end = pointAt(to, RADIUS);
  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 0 1 ${end.x} ${end.y}`;
}

function colorFor(value) {
  const segment = SEGMENTS.find((s) => value <= s.to) || SEGMENTS[SEGMENTS.length - 1];
  return segment.color;
}

export default function FearGreedIndex() {
  const [today, setToday] = useState(null);
  const [yesterday, setYesterday] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('https://api.alternative.me/fng/?limit=2');
        if (!res.ok) throw new Error('Index request failed');
        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : [];
        if (list.length === 0) throw new Error('No data');
        if (cancelled) return;
        setToday({ value: Number(list[0].value), label: list[0].value_classification });
        if (list[1]) {
          setYesterday({ value: Number(list[1].value), label: list[1].value_classification });
        }
        setError('');
      } catch (err) {
        console.error('Error loading Fear & Greed index: ', err);
        if (!cancelled) setError('Could not load the index right now.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const timer = setInterval(load, 30 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const needle = today ? pointAt(today.value, 62) : null;

  return (
    <section className="bg-[#181a20] border border-gray-800 rounded-2xl p-4 text-xs">
      <h2 className="text-base font-bold text-white">Fear &amp; Greed Index</h2>
      <p className="text-gray-500 mb-2">Crypto market sentiment</p>

      {loading && <p className="text-gray-400 text-center py-8">Loading...</p>}
      {!loading && error && <p className="text-red-400 text-center py-8">{error}</p>}

      {!loading && !error && today && (
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 200 112" className="w-full max-w-[260px]">
            {SEGMENTS.map((s) => (
              <path
                key={s.from}
                d={arcPath(s.from, s.to)}
                stroke={s.color}
                strokeWidth="14"
                fill="none"
              />
            ))}
            <line
              x1={CX}
              y1={CY}
              x2={needle.x}
              y2={needle.y}
              stroke="#ffffff"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx={CX} cy={CY} r="6" fill="#ffffff" />
          </svg>

          <div className="text-3xl font-bold mt-1" style={{ color: colorFor(today.value) }}>
            {today.value}
          </div>
          <div className="text-sm font-semibold text-white">{today.label}</div>

          {yesterday && (
            <div className="text-gray-500 mt-3">
              Yesterday: <span style={{ color: colorFor(yesterday.value) }}>{yesterday.value}</span>{' '}
              · {yesterday.label}
            </div>
          )}
        </div>
      )}

      <p className="text-[10px] text-gray-600 mt-3">Source: alternative.me</p>
    </section>
  );
}