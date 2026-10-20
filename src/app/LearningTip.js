'use client';

import { useState, useEffect } from 'react';

const TIPS = [
  {
    category: 'Basics',
    title: 'What is leverage?',
    text: 'Leverage lets you open a position larger than the money you put in. It magnifies gains and losses equally: with 20x leverage, a 5% move against you can wipe out your whole amount.',
  },
  {
    category: 'Risk',
    title: 'Risk only a small part',
    text: 'Many traders risk only 1-2% of their funds on a single trade, so one bad trade cannot end their learning journey.',
  },
  {
    category: 'Basics',
    title: 'What is a candlestick?',
    text: 'Each candle shows the open, high, low and close price for a period of time. A green candle closed higher than it opened; a red candle closed lower.',
  },
  {
    category: 'Risk',
    title: 'What is a stop-loss?',
    text: 'A stop-loss is an order that closes a position automatically when the price reaches a level you chose. It limits how much you can lose on a trade.',
  },
  {
    category: 'Market',
    title: 'What is volatility?',
    text: 'Volatility describes how fast and how far a price moves. Crypto prices can move several percent in a single day, which creates both opportunity and risk.',
  },
  {
    category: 'Strategy',
    title: 'Why diversify?',
    text: 'Spreading your funds across different assets means one coin falling does not damage your whole portfolio.',
  },
  {
    category: 'Security',
    title: 'Protect your account',
    text: 'Never share your password or recovery phrase with anyone, and be careful with links sent in messages. Real support will never ask for them.',
  },
  {
    category: 'Security',
    title: 'Check wallet addresses twice',
    text: 'Blockchain transactions cannot be reversed. Always double-check the full address and the network before sending anything.',
  },
  {
    category: 'Market',
    title: 'Fear & Greed Index',
    text: 'The Fear & Greed Index summarizes market mood. Extreme fear can mean people are panicking and prices are low; extreme greed can mean the market is overheated.',
  },
  {
    category: 'Strategy',
    title: 'Dollar-cost averaging',
    text: 'Buying a fixed amount at regular intervals instead of all at once reduces the impact of buying at a bad moment.',
  },
  {
    category: 'Basics',
    title: 'Price is not the same as value',
    text: 'A low price per coin does not mean a coin is cheap. Market cap (price multiplied by circulating supply) shows the real size of a project.',
  },
  {
    category: 'Mindset',
    title: 'Control your emotions',
    text: 'Fear and greed push people into rushed decisions. Write down your plan before you trade and stick to it.',
  },
];

export default function LearningTip() {
  const [index, setIndex] = useState(0);

  // Start with a different tip each day (set after mount to avoid server/client mismatch)
  useEffect(() => {
    const startOfYear = new Date(new Date().getFullYear(), 0, 0).getTime();
    const dayOfYear = Math.floor((Date.now() - startOfYear) / 86400000);
    setIndex(dayOfYear % TIPS.length);
  }, []);

  // Rotate automatically every 20 seconds (the timer restarts whenever the tip changes)
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % TIPS.length);
    }, 20000);
    return () => clearInterval(timer);
  }, [index]);

  const tip = TIPS[index];

  return (
    <div className="bg-[#2b313a]/20 border border-[#2b313a] rounded-2xl p-4 space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-white text-sm">💡 Learning Tip</h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f0b90b]/15 text-[#f0b90b] font-semibold">
          {tip.category}
        </span>
      </div>

      <div className="text-white font-semibold text-sm">{tip.title}</div>
      <p className="text-gray-400 text-sm leading-relaxed">{tip.text}</p>

      <div className="flex justify-between items-center pt-1">
        <span className="text-[10px] text-gray-600">
          {index + 1} / {TIPS.length} · For learning only, not financial advice
        </span>
        <button
          onClick={() => setIndex((index + 1) % TIPS.length)}
          className="text-[#f0b90b] hover:underline font-semibold text-xs cursor-pointer"
        >
          Next tip →
        </button>
      </div>
    </div>
  );
}