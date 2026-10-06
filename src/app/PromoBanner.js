'use client';

import { useState, useEffect } from 'react';

const BANNERS = [
  {
    icon: '⚡',
    title: 'Live Market Prices',
    text: 'Follow real-time crypto prices and trade with professional tools.',
    tab: 'market',
    button: 'View Market',
  },
  {
    icon: '💳',
    title: 'Deposit & Withdraw',
    text: 'Fund your account or request a withdrawal in just a few steps.',
    tab: 'asset',
    button: 'Open Assets',
  },
  {
    icon: '🛟',
    title: 'Support When You Need It',
    text: 'Our support team is here to help you with any question.',
    tab: null,
    button: null,
  },
];

export default function PromoBanner({ onNavigate }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const banner = BANNERS[index];

  return (
    <div className="bg-gradient-to-r from-[#f0b90b]/15 to-[#1e2329] border border-[#f0b90b]/30 rounded-2xl p-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <span className="text-3xl">{banner.icon}</span>
          <div>
            <div className="font-bold text-white text-sm">{banner.title}</div>
            <div className="text-gray-400 text-xs">{banner.text}</div>
          </div>
        </div>
        {banner.tab && (
          <button
            onClick={() => onNavigate && onNavigate(banner.tab)}
            className="bg-[#f0b90b] hover:bg-[#d9a70a] text-black font-bold text-xs px-4 py-2 rounded-xl cursor-pointer whitespace-nowrap"
          >
            {banner.button}
          </button>
        )}
      </div>

      <div className="flex justify-center gap-1.5 mt-3">
        {BANNERS.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={'Go to banner ' + (i + 1)}
            className={
              i === index
                ? 'w-5 h-1.5 rounded-full bg-[#f0b90b] cursor-pointer'
                : 'w-1.5 h-1.5 rounded-full bg-gray-600 cursor-pointer'
            }
          />
        ))}
      </div>
    </div>
  );
}