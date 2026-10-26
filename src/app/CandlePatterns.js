'use client';

import { useState, useEffect } from 'react';

const ROTATE_MS = 6000;
const GREEN = '#0ecb81';
const RED = '#f6465d';

// Each candle is [open, high, low, close] on a 0-100 price scale.
// "highlight" lists the candle positions that form the pattern.
const PATTERNS = [
  {
    name: 'Hammer',
    signal: 'Bullish signal',
    tone: 'up',
    text: 'A small body near the top with a long lower wick, after a fall. Buyers pushed the price back up, which can hint that selling pressure is fading.',
    highlight: [3],
    candles: [
      [80, 82, 68, 70],
      [70, 72, 58, 60],
      [60, 62, 48, 50],
      [52, 54, 30, 53],
      [53, 66, 52, 65],
    ],
  },
  {
    name: 'Shooting Star',
    signal: 'Bearish signal',
    tone: 'down',
    text: 'A small body near the bottom with a long upper wick, after a rise. Sellers rejected the higher prices, which can hint that buying pressure is fading.',
    highlight: [3],
    candles: [
      [30, 42, 29, 40],
      [40, 52, 39, 50],
      [50, 62, 49, 60],
      [60, 84, 58, 59],
      [59, 60, 46, 47],
    ],
  },
  {
    name: 'Bullish Engulfing',
    signal: 'Bullish signal',
    tone: 'up',
    text: 'A large green candle fully covers the body of the previous red candle after a fall. Buyers took control, which can hint at a move upward.',
    highlight: [2, 3],
    candles: [
      [78, 80, 68, 70],
      [70, 72, 60, 62],
      [62, 64, 54, 56],
      [54, 74, 52, 72],
      [72, 82, 70, 80],
    ],
  },
  {
    name: 'Bearish Engulfing',
    signal: 'Bearish signal',
    tone: 'down',
    text: 'A large red candle fully covers the body of the previous green candle after a rise. Sellers took control, which can hint at a move downward.',
    highlight: [2, 3],
    candles: [
      [30, 42, 29, 40],
      [40, 52, 39, 50],
      [50, 60, 49, 58],
      [60, 62, 38, 40],
      [40, 42, 28, 30],
    ],
  },
  {
    name: 'Doji',
    signal: 'Indecision',
    tone: 'neutral',
    text: 'The open and close are almost equal, so neither buyers nor sellers won the period. It shows indecision and often appears before a change of direction, but it needs confirmation.',
    highlight: [3],
    candles: [
      [40, 52, 39, 50],
      [50, 60, 49, 58],
      [58, 66, 57, 64],
      [64, 74, 54, 64.5],
      [64, 66, 52, 54],
    ],
  },
];

function CandleChart({ candles, highlight }) {
  const y = (price) => 105 - price;
  const xs = candles.map((_, i) => 22 + i * 38);
  const left = xs[highlight[0]] - 17;
  const right = xs[highlight[highlight.length - 1]] + 17;

  return (
    <svg viewBox="0 0 200 112" className="w-full h-36" role="img" aria-label="Candlestick pattern example">
      <rect
        x={left}
        y="4"
        width={right - left}
        height="104"
        rx="6"
        fill="#f0b90b"
        fillOpacity="0.08"
        stroke="#f0b90b"
        strokeOpacity="0.6"
        strokeDasharray="4 3"
      />
      {candles.map(([open, high, low, close], i) => {
        const color = close >= open ? GREEN : RED;
        const top = y(Math.max(open, close));
        const height = Math.max(Math.abs(close - open), 1.5);
        return (
          <g key={i}>
            <line
              x1={xs[i]}
              y1={y(high)}
              x2={xs[i]}
              y2={y(low)}
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <rect x={xs[i] - 8} y={top} width="16" height={height} rx="1.5" fill={color} />
          </g>
        );
      })}
    </svg>
  );
}

export default function CandlePatterns() {
  const [index, setIndex] = useState(0);

  // Move to the next pattern every few seconds (the timer restarts whenever the pattern changes)
  useEffect(() => {
    const timer = setTimeout(() => setIndex((prev) => (prev + 1) % PATTERNS.length), ROTATE_MS);
    return () => clearTimeout(timer);
  }, [index]);

  const pattern = PATTERNS[index];
  const badgeClass =
    pattern.tone === 'up'
      ? 'bg-[#0ecb81]/15 text-[#0ecb81]'
      : pattern.tone === 'down'
      ? 'bg-[#f6465d]/15 text-[#f6465d]'
      : 'bg-[#f0b90b]/15 text-[#f0b90b]';

  return (
    <div className="bg-[#2b313a]/20 border border-[#2b313a] rounded-2xl p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-white text-sm">🕯️ Candlestick Patterns</h3>
        <span className="text-[10px] text-gray-500">
          {index + 1} / {PATTERNS.length}
        </span>
      </div>

      <div className="bg-[#181a20] border border-gray-800 rounded-xl p-3">
        <CandleChart key={pattern.name} candles={pattern.candles} highlight={pattern.highlight} />
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="text-white font-bold text-base">{pattern.name}</div>
        <span className={'text-[11px] font-semibold px-2 py-0.5 rounded-full ' + badgeClass}>
          {pattern.signal}
        </span>
      </div>

      <p className="text-gray-400 text-sm leading-relaxed">{pattern.text}</p>

      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {PATTERNS.map((p, i) => (
            <button
              key={p.name}
              onClick={() => setIndex(i)}
              aria-label={'Show ' + p.name}
              className={
                i === index
                  ? 'w-5 h-1.5 rounded-full bg-[#f0b90b] cursor-pointer'
                  : 'w-1.5 h-1.5 rounded-full bg-gray-600 cursor-pointer'
              }
            />
          ))}
        </div>
        <button
          onClick={() => setIndex((index + 1) % PATTERNS.length)}
          className="text-[#f0b90b] hover:underline font-semibold text-xs cursor-pointer"
        >
          Next pattern →
        </button>
      </div>

      <div className="text-[10px] text-gray-600">
        Patterns are not guarantees. For learning only, not financial advice.
      </div>
    </div>
  );
}