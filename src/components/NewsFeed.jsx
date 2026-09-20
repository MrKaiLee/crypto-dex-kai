'use client';
import React, { useState, useEffect, useCallback } from 'react';

// Loads the articles of one category from our own news route.
const loadCategory = (category) => async () => {
  const res = await fetch(`/api/news?category=${category}`);
  if (!res.ok) throw new Error('News request failed');
  const json = await res.json();
  return Array.isArray(json.articles) ? json.articles.slice(0, 12) : [];
};

// Each tab knows how to load its own articles.
const TABS = [
  { id: 'crypto', label: 'Crypto', load: loadCategory('crypto') },
  { id: 'stocks', label: 'Stocks', load: loadCategory('stocks') },
  { id: 'forex', label: 'Forex', load: loadCategory('forex') },
];

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NewsFeed() {
  const [activeId, setActiveId] = useState(TABS[0].id);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);

  const loadNews = useCallback(
    async (showSpinner) => {
      const tab = TABS.find((t) => t.id === activeId);
      if (!tab) return;
      if (showSpinner) setLoading(true);
      try {
        const items = await tab.load();
        setArticles(items);
        setError('');
        setUpdatedAt(Date.now());
      } catch (err) {
        console.error('Error loading news: ', err);
        setError('Could not load the news right now.');
      } finally {
        setLoading(false);
      }
    },
    [activeId]
  );

  // Load on mount and refresh every 5 minutes
  useEffect(() => {
    loadNews(true);
    const timer = setInterval(() => loadNews(false), 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [loadNews]);

  return (
    <section className="bg-[#181a20] border border-gray-800 rounded-2xl p-4 text-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f0b90b] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f0b90b]"></span>
          </span>
          <h2 className="text-base font-bold text-white">Live News</h2>
        </div>
        {updatedAt && (
          <span className="text-[10px] text-gray-500">Updated {timeAgo(updatedAt)}</span>
        )}
      </div>

      {TABS.length > 1 && (
        <div className="flex gap-2 mb-3">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveId(tab.id)}
              className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                activeId === tab.id
                  ? 'bg-[#f0b90b] text-black font-semibold'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="animate-pulse">
              <div className="h-3 bg-gray-800 rounded w-11/12 mb-2"></div>
              <div className="h-2 bg-gray-800 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-6">
          <p className="text-red-400 mb-3">{error}</p>
          <button
            onClick={() => loadNews(true)}
            className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-xl cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <ul className="divide-y divide-gray-800">
          {articles.map((article) => (
            <li key={article.id}>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block py-3 hover:bg-[#121212] rounded-lg px-2 -mx-2 transition-colors"
              >
                <p className="text-sm text-white font-medium line-clamp-2">{article.title}</p>
                <p className="text-[10px] text-gray-500 mt-1">
                  <span className="text-[#f0b90b]">{article.source}</span> ·{' '}
                  {timeAgo(article.publishedAt)}
                </p>
              </a>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[10px] text-gray-600 mt-3">
        Headlines from public news feeds. Tap an article to read it at the source.
      </p>
    </section>
  );
}