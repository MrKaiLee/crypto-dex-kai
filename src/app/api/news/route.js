export const dynamic = 'force-dynamic';

// Public RSS feeds. If one fails, the others still work.
const SOURCES = {
  crypto: [
    { name: 'Cointelegraph', url: 'https://cointelegraph.com/rss' },
    { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss' },
    { name: 'Decrypt', url: 'https://decrypt.co/feed' },
  ],
};

function decodeEntities(text) {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function getTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  if (!match) return '';
  const cleaned = match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
  return decodeEntities(cleaned);
}

function parseRss(xml, sourceName) {
  const articles = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null && articles.length < 15) {
    const block = match[1];
    const title = getTag(block, 'title');
    const link = getTag(block, 'link');
    const pubDate = getTag(block, 'pubDate');
    if (!title || !link) continue;
    const published = pubDate ? Date.parse(pubDate) : NaN;
    articles.push({
      id: link,
      title,
      url: link,
      source: sourceName,
      publishedAt: Number.isNaN(published) ? Date.now() : published,
    });
  }
  return articles;
}

async function loadSource(source) {
  const res = await fetch(source.url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsReader/1.0)' },
    signal: AbortSignal.timeout(8000),
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  return parseRss(xml, source.name);
}

export async function GET(request) {
  const category = new URL(request.url).searchParams.get('category') || 'crypto';
  const sources = SOURCES[category];
  if (!sources) {
    return Response.json({ error: 'Unknown category' }, { status: 400 });
  }

  const results = await Promise.allSettled(sources.map(loadSource));

  const seen = new Set();
  const articles = [];
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      result.value.forEach((article) => {
        if (!seen.has(article.url)) {
          seen.add(article.url);
          articles.push(article);
        }
      });
    } else {
      console.error(`News source failed (${sources[index].name}):`, result.reason?.message);
    }
  });

  if (articles.length === 0) {
    return Response.json({ error: 'No news available' }, { status: 502 });
  }

  articles.sort((a, b) => b.publishedAt - a.publishedAt);

  return Response.json(
    { articles: articles.slice(0, 15) },
    { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' } }
  );
}