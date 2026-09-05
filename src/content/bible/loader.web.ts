import type { BookId } from '../books';

import type { BibleBook } from './types';

/**
 * Web build. Books are served as static files from `public/bible/nrsv/` (primary, NRSV)
 * and fetched on demand, so ~5 MB of Scripture never enters the JS bundle and
 * cannot delay first paint. Once fetched a book is cached for the session, and
 * the browser caches the file itself beyond that. KJV remains at `public/bible/kjv/` as fallback.
 */
const cache = new Map<BookId, BibleBook>();
const inFlight = new Map<BookId, Promise<BibleBook>>();

export async function loadBook(id: BookId): Promise<BibleBook> {
  const cached = cache.get(id);
  if (cached) return cached;

  // Two cards opening the same book at once should share one request.
  const existing = inFlight.get(id);
  if (existing) return existing;

  const request = (async () => {
    const res = await fetch(`/bible/nrsv/${id}.json`);
    if (!res.ok) throw new Error(`Could not load ${id}: HTTP ${res.status}`);
    const book = (await res.json()) as BibleBook;
    cache.set(id, book);
    return book;
  })().finally(() => inFlight.delete(id));

  inFlight.set(id, request);
  return request;
}
