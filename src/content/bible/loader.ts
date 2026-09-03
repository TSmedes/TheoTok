import type { BookId } from '../books';

import { BOOK_FILES } from './bookMap.generated';
import type { BibleBook } from './types';

/**
 * Tier two of the data plan: whole books, loaded only when the reader sheet
 * opens. Native reads them straight out of the bundle — Metro evaluates a
 * module on first `require`, so a book is parsed when it is first opened rather
 * than at startup. The web build overrides this file (see loader.web.ts) and
 * fetches from `public/` so the JS bundle stays small.
 */
const cache = new Map<BookId, BibleBook>();

export async function loadBook(id: BookId): Promise<BibleBook> {
  const cached = cache.get(id);
  if (cached) return cached;
  const book = BOOK_FILES[id]();
  cache.set(id, book);
  return book;
}
