import { NextResponse } from 'next/server';

const SYMBOLS = 'EUR,GBP,JPY,CHF,CAD,AUD';

export async function GET() {
  try {
    const res = await fetch(
      'https://api.frankfurter.dev/v1/latest?base=USD&symbols=' + SYMBOLS,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      return NextResponse.json({ error: 'Forex provider error' }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({ date: data.date, base: data.base, rates: data.rates });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch forex rates' }, { status: 502 });
  }
}