'use client';

import { useState, useEffect } from 'react';

const ROUND_SIZE = 5;
const BEST_KEY = 'crypto_quiz_best';

const QUESTIONS = [
  {
    question: 'In crypto slang, what does "HODL" mean?',
    options: [
      'Holding your coins for the long term instead of selling',
      'Hedging on daily limits',
      'A type of trading bot',
      'Higher order digital ledger',
    ],
    answer: 0,
    explanation:
      'It began as a typo of "hold" in a 2013 forum post and became a motto for holding through price swings.',
  },
  {
    question: 'What is a blockchain?',
    options: [
      'A shared digital ledger where records are grouped into linked blocks',
      'A password manager',
      "A bank's private vault",
      'A type of trading chart',
    ],
    answer: 0,
    explanation: 'Each block links to the one before it, which makes past records very hard to change.',
  },
  {
    question: 'Bitcoin was created by someone using which name?',
    options: ['Satoshi Nakamoto', 'Vitalik Buterin', 'Charlie Lee', 'Changpeng Zhao'],
    answer: 0,
    explanation: 'Satoshi Nakamoto is a pseudonym. The real identity has never been confirmed.',
  },
  {
    question: 'What is the maximum number of bitcoins that will ever exist?',
    options: ['21 million', '100 million', '1 billion', 'There is no limit'],
    answer: 0,
    explanation: "Bitcoin's code caps the supply at 21 million coins, which makes it scarce.",
  },
  {
    question: 'What is a stablecoin such as USDT designed to do?',
    options: [
      'Stay close to the value of a stable asset like the US dollar',
      'Double in price every year',
      'Hide who owns it',
      'Replace all other coins',
    ],
    answer: 0,
    explanation:
      'Stablecoins aim to hold a steady price, so traders use them to park value between trades. Their stability still depends on the issuer and its reserves.',
  },
  {
    question: 'What does leverage do to a trade?',
    options: [
      'It magnifies both profits and losses',
      'It guarantees a profit',
      'It removes trading fees',
      'It stops the price from moving',
    ],
    answer: 0,
    explanation:
      'With 20x leverage, a 5% move against you can wipe out your whole margin. Higher leverage means higher risk.',
  },
  {
    question: 'Which of these should you never share with anyone?',
    options: [
      'Your public wallet address',
      'Your recovery (seed) phrase',
      'The name of a coin',
      'A trading pair you follow',
    ],
    answer: 1,
    explanation:
      'Anyone who has your recovery phrase can take all your funds. Real support will never ask for it.',
  },
  {
    question: 'On most price charts, what does a green candlestick show?',
    options: [
      'The price closed higher than it opened',
      'The price closed lower than it opened',
      'The market was closed',
      'Trading volume was zero',
    ],
    answer: 0,
    explanation:
      'Each candle shows the open, high, low and close. Green usually means a rise over that period and red a fall, although some charts reverse the colors.',
  },
  {
    question: "How is a coin's market cap calculated?",
    options: [
      'Price multiplied by circulating supply',
      'The highest price it ever reached',
      'The number of exchanges that list it',
      'Its daily trading volume',
    ],
    answer: 0,
    explanation:
      'A low price per coin does not mean a coin is cheap. Market cap shows the real size of a project.',
  },
  {
    question: 'What does "volatility" describe?',
    options: [
      'How fast and how far a price moves',
      'How quickly a transaction is confirmed',
      'The fee charged per trade',
      'How many coins a wallet holds',
    ],
    answer: 0,
    explanation: 'Crypto prices can move several percent in a single day, which creates both opportunity and risk.',
  },
  {
    question: 'What is a stop-loss order for?',
    options: [
      'Closing a position automatically at a price you chose to limit losses',
      'Buying more when the price rises',
      'Freezing your account',
      'Guaranteeing a profit',
    ],
    answer: 0,
    explanation:
      'It caps how much you can lose on a trade, although in a fast market the exit price can differ from the level you set.',
  },
  {
    question: 'What is a "bull market"?',
    options: [
      'A period when prices are generally rising',
      'A market that is closed',
      'A period when prices keep falling',
      'A market only for large investors',
    ],
    answer: 0,
    explanation: 'The opposite, a period of generally falling prices, is called a bear market.',
  },
];

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildRound() {
  return shuffle(QUESTIONS)
    .slice(0, ROUND_SIZE)
    .map((q) => ({
      question: q.question,
      explanation: q.explanation,
      choices: shuffle(q.options.map((text, i) => ({ text, correct: i === q.answer }))),
    }));
}

function messageFor(score, total) {
  if (score === total) return 'Perfect score! You really know your crypto basics.';
  if (score >= total - 1) return 'Great job! You are one step from perfect.';
  if (score >= Math.ceil(total / 2)) return 'Good effort! Play again to improve.';
  return 'Keep learning, you will get there. Try again!';
}

function optionClass(choice, index, picked) {
  const base = 'w-full text-left px-4 py-3 rounded-xl border text-sm transition ';
  if (picked === null) {
    return base + 'bg-[#181a20] border-gray-800 text-gray-200 hover:border-[#f0b90b] cursor-pointer';
  }
  if (choice.correct) return base + 'bg-[#0ecb81]/10 border-[#0ecb81] text-[#0ecb81]';
  if (index === picked) return base + 'bg-[#f6465d]/10 border-[#f6465d] text-[#f6465d]';
  return base + 'bg-[#181a20] border-gray-800 text-gray-500 opacity-60';
}

export default function CryptoQuiz() {
  const [stage, setStage] = useState('intro');
  const [round, setRound] = useState([]);
  const [current, setCurrent] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(null);
  const [newBest, setNewBest] = useState(false);

  // Read the best score saved in this browser
  useEffect(() => {
    try {
      const saved = localStorage.getItem(BEST_KEY);
      if (saved !== null) setBest(Number(saved));
    } catch (e) {
      // Storage may be unavailable; the best score simply stays empty
    }
  }, []);

  function start() {
    setRound(buildRound());
    setCurrent(0);
    setPicked(null);
    setScore(0);
    setNewBest(false);
    setStage('playing');
  }

  function choose(index) {
    if (picked !== null) return;
    setPicked(index);
    if (round[current].choices[index].correct) setScore((s) => s + 1);
  }

  function next() {
    if (current + 1 < round.length) {
      setCurrent(current + 1);
      setPicked(null);
      return;
    }
    if (best === null || score > best) {
      setNewBest(true);
      setBest(score);
      try {
        localStorage.setItem(BEST_KEY, String(score));
      } catch (e) {
        // Ignore storage errors
      }
    }
    setStage('result');
  }

  const question = stage === 'playing' ? round[current] : null;
  const progress = round.length
    ? ((current + (picked !== null ? 1 : 0)) / round.length) * 100
    : 0;

  return (
    <div className="bg-gradient-to-br from-[#f0b90b]/10 via-[#1e2329] to-[#181a20] border border-[#2b313a] rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white text-sm">🧠 Crypto Quiz</h3>
        {best !== null && (
          <span className="text-[11px] text-[#f0b90b] font-semibold">
            🏆 Best: {best} / {ROUND_SIZE}
          </span>
        )}
      </div>

      {stage === 'intro' && (
        <div className="space-y-3">
          <p className="text-gray-400 text-sm leading-relaxed">
            Test what you know in {ROUND_SIZE} quick questions. Every answer comes with a short explanation, so you
            learn while you play.
          </p>
          <button
            onClick={start}
            className="bg-[#f0b90b] hover:bg-[#d9a70a] text-black font-bold text-sm px-5 py-2 rounded-xl cursor-pointer"
          >
            Start quiz
          </button>
        </div>
      )}

      {stage === 'playing' && question && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">
              Question {current + 1} of {round.length}
            </span>
            <span className="text-[#f0b90b] font-semibold">Score: {score}</span>
          </div>

          <div className="h-1.5 rounded-full bg-[#2b313a] overflow-hidden">
            <div
              className="h-full bg-[#f0b90b] transition-all duration-500"
              style={{ width: progress + '%' }}
            />
          </div>

          <div className="text-white font-semibold text-sm">{question.question}</div>

          <div className="space-y-2">
            {question.choices.map((choice, index) => (
              <button
                key={choice.text}
                onClick={() => choose(index)}
                disabled={picked !== null}
                className={optionClass(choice, index, picked)}
              >
                {picked !== null && choice.correct ? '✓ ' : ''}
                {picked !== null && index === picked && !choice.correct ? '✗ ' : ''}
                {choice.text}
              </button>
            ))}
          </div>

          {picked !== null && (
            <div className="space-y-3">
              <div
                className={
                  'text-xs rounded-xl p-3 border ' +
                  (question.choices[picked].correct
                    ? 'bg-[#0ecb81]/10 border-[#0ecb81]/40 text-gray-300'
                    : 'bg-[#f6465d]/10 border-[#f6465d]/40 text-gray-300')
                }
              >
                <span className="font-bold">
                  {question.choices[picked].correct ? 'Correct! ' : 'Not quite. '}
                </span>
                {question.explanation}
              </div>
              <button
                onClick={next}
                className="bg-[#2b313a] hover:bg-[#363c4e] text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
              >
                {current + 1 < round.length ? 'Next question →' : 'See my result →'}
              </button>
            </div>
          )}
        </div>
      )}

      {stage === 'result' && (
        <div className="space-y-3 text-center">
          <div className="text-4xl">{score === round.length ? '🏆' : score >= 3 ? '🎉' : '📚'}</div>
          <div className="text-white text-3xl font-bold">
            {score} / {round.length}
          </div>
          {newBest && <div className="text-[#f0b90b] text-xs font-semibold">New best score!</div>}
          <p className="text-gray-400 text-sm">{messageFor(score, round.length)}</p>
          <button
            onClick={start}
            className="bg-[#f0b90b] hover:bg-[#d9a70a] text-black font-bold text-sm px-5 py-2 rounded-xl cursor-pointer"
          >
            Play again
          </button>
        </div>
      )}

      <div className="text-[10px] text-gray-600">For learning only, not financial advice.</div>
    </div>
  );
}