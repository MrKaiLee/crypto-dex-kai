'use client';

import { useState, useEffect } from 'react';

const ROTATE_MS = 7000;

// "photo" is left empty on purpose. Add a link only for an image you have the right to use.
const PEOPLE = [
  {
    name: 'Michael Saylor',
    initials: 'MS',
    role: 'Co-founder of Strategy (formerly MicroStrategy), known for holding Bitcoin as a company treasury asset.',
    keywords: ['saylor', 'microstrategy'],
    photo: '',
  },
  {
    name: 'Elon Musk',
    initials: 'EM',
    role: 'Entrepreneur behind Tesla and SpaceX. His posts have often drawn attention to coins such as Dogecoin.',
    keywords: ['elon musk', 'musk'],
    photo: '',
  },
  {
    name: 'Changpeng Zhao',
    initials: 'CZ',
    role: 'Co-founder of Binance, one of the largest crypto exchanges in the world.',
    keywords: ['changpeng', 'binance founder'],
    photo: '',
  },
  {
    name: 'Vitalik Buterin',
    initials: 'VB',
    role: 'Co-founder of Ethereum, the network behind the ETH coin.',
    keywords: ['vitalik', 'buterin'],
    photo: '',
  },
  {
    name: 'Brian Armstrong',
    initials: 'BA',
    role: 'Co-founder of Coinbase, a major crypto exchange.',
    keywords: ['brian armstrong'],
    photo: '',
  },
  {
    name: 'Cathie Wood',
    initials: 'CW',
    role: 'Founder of ARK Invest, a well-known investor in innovation including crypto.',
    keywords: ['cathie wood', 'ark invest'],
    photo: '',
  },
];

// Accepts different news response shapes and returns a simple list
function normalizeNews(data) {
  let list = [];
  if (Array.isArray(data)) {
    list = data;
  } else if (data && typeof data === 'object') {
    list = data.articles || data.results || data.items || data.news || data.data || data.Data || [];
  }
  if (!Array.isArray(list)) return [];

  return list
    .map((item) => {
      const sourceObject = item.source && typeof item.source === 'object' ? item.source : null;
      const sourceName = sourceObject
        ? sourceObject.name || sourceObject.title || ''
        : typeof item.source === 'string'
        ? item.source
        : '';
      return {
        title: item.title || item.headline || '',
        url: item.url || item.link || '',
        source: sourceName,
        time:
          item.publishedAt ||
          item.pubDate ||
          item.published_at ||
          item.date ||
          item.created_at ||
          (item.published_on ? item.published_on * 1000 : null),
      };
    })
    .filter((n) => n.title);
}

function timeAgo(value) {
  if (!value) return '';
  const ms = new Date(value).getTime();
  if (Number.isNaN(ms)) return '';
  const minutes = Math.floor((Date.now() - ms) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return minutes + ' min ago';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + ' h ago';
  return Math.floor(hours / 24) + ' d ago';
}

export default function CryptoVoices() {
  const [index, setIndex] = useState(0);
  const [news, setNews] = useState([]);

  // Load headlines from the existing news route (and refresh every 10 minutes)
  useEffect(() => {
    let cancelled = false;

    async function loadNews() {
      try {
        const res = await fetch('/api/news');
        if (!res.ok) throw new Error('Bad response');
        const data = await res.json();
        if (!cancelled) setNews(normalizeNews(data));
      } catch (e) {
        console.warn('Crypto voices: could not load news', e.message);
      }
    }

    loadNews();
    const refresh = setInterval(loadNews, 10 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(refresh);
    };
  }, []);

  // Move to the next person every few seconds (the timer restarts whenever the person changes)
  useEffect(() => {
    const timer = setTimeout(() => setIndex((prev) => (prev + 1) % PEOPLE.length), ROTATE_MS);
    return () => clearTimeout(timer);
  }, [index]);

  const person = PEOPLE[index];
  const matches = news
    .filter((n) => person.keywords.some((k) => n.title.toLowerCase().includes(k)))
    .slice(0, 2);
  const shown = matches.length > 0 ? matches : news.slice(0, 2);

  return (
    <div className="bg-gradient-to-br from-[#f0b90b]/10 via-[#1e2329] to-[#181a20] border border-[#2b313a] rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white text-sm">🌟 Crypto Voices</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIndex((index - 1 + PEOPLE.length) % PEOPLE.length)}
            aria-label="Previous person"
            className="w-7 h-7 rounded-full bg-[#2b313a] hover:bg-[#363c4e] text-white text-sm cursor-pointer"
          >
            ‹
          </button>
          <button
            onClick={() => setIndex((index + 1) % PEOPLE.length)}
            aria-label="Next person"
            className="w-7 h-7 rounded-full bg-[#2b313a] hover:bg-[#363c4e] text-white text-sm cursor-pointer"
          >
            ›
          </button>
        </div>
      </div>

      <div className="flex items-start gap-4">
        {person.photo ? (
          <img
            src={person.photo}
            alt={person.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-[#f0b90b] shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#f0b90b] to-[#b8860b] flex items-center justify-center text-black font-extrabold text-lg shrink-0 border-2 border-[#f0b90b]/50">
            {person.initials}
          </div>
        )}

        <div className="min-w-0">
          <div className="text-white font-bold text-base">{person.name}</div>
          <div className="text-gray-400 text-xs leading-relaxed">{person.role}</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-[11px] text-gray-500">
          {matches.length > 0
            ? 'Latest headlines about ' + person.name
            : news.length > 0
            ? 'No fresh headlines about ' + person.name + ' right now. Latest crypto news:'
            : 'Headlines are loading...'}
        </div>

        {shown.map((n, i) => {
          const content = (
            <div className="bg-[#181a20] border border-gray-800 hover:border-[#f0b90b]/60 transition rounded-xl p-3">
              <div className="text-white text-sm leading-snug">{n.title}</div>
              <div className="text-[10px] text-gray-500 mt-1">
                {n.source}
                {n.source && timeAgo(n.time) ? ' · ' : ''}
                {timeAgo(n.time)}
              </div>
            </div>
          );
          return n.url ? (
            <a key={i} href={n.url} target="_blank" rel="noopener noreferrer" className="block">
              {content}
            </a>
          ) : (
            <div key={i}>{content}</div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {PEOPLE.map((p, i) => (
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
        <span className="text-[10px] text-gray-600">News from your feed. Not financial advice.</span>
      </div>
    </div>
  );
}