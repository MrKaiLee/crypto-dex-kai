export const dynamic = 'force-dynamic';

const COIN_IDS = 'bitcoin,ethereum,tether,solana,cardano,binancecoin,ripple,dogecoin';

// In-memory cache shared across requests on the same server instance
let cache = { data: null, fetchedAt: 0 };
const CACHE_MS = 8000; // refresh from CoinGecko at most every 8 seconds

export async function GET() {
  const now = Date.now();

  if (cache.data && now - cache.fetchedAt < CACHE_MS) {
    return Response.json(cache.data);
  }

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${COIN_IDS}&vs_currencies=usd&include_24hr_change=true`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    cache = { data, fetchedAt: now };
    return Response.json(data);
  } catch (error) {
    console.error('Price fetch failed:', error.message);
    // If CoinGecko fails, serve the last good cache instead of an error
    if (cache.data) {
      return Response.json(cache.data);
    }
    return Response.json({ error: 'Price data unavailable' }, { status: 502 });
  }
}