/**
 * The app's single entry point to the content library.
 *
 * Everything here is bundled JSON, resolved at build time by
 * `scripts/build-bible.ts` and `scripts/build-feed-verses.ts`. The app makes no
 * network calls: the feed works offline, and no upstream API can take it down.
 *
 * Only tier one — the verses the card library actually cites — is loaded here.
 * The full KJV stays in per-book files for the reader sheet to pull in on
 * demand, so ~5 MB of Scripture never sits in the way of first paint.
 */

import doctrineCards from './cards/doctrine.json';
import generatedDoctrineCards from './cards/doctrine.generated.json';
import historyEarly from './cards/history-early.json';
import historyModern from './cards/history-modern.json';
import historyPeople from './cards/history-people.json';
import historyWorld from './cards/history-world.json';
import scriptureCards from './cards/scripture.json';
import feedVerses from './bible/feed-verses.json';
import { refKey } from './refs';
import { renderCard, type RenderContext } from './render';
import sourcesData from './sources/sources.json';
import type { Card, Ref, RenderedCard, Source } from './types';

/**
 * The JSON files are validated against the zod schemas in `schema.ts` by
 * `src/content/__tests__/library.test.ts`, which runs in `npm test`. Asserting
 * the type here rather than re-validating at runtime keeps zod out of the app
 * bundle and costs nothing at startup.
 */
export const SOURCES: readonly Source[] = sourcesData as Source[];

export const SOURCES_BY_ID: ReadonlyMap<string, Source> = new Map(SOURCES.map((s) => [s.id, s]));

/**
 * Hand-written cards and imported ones sit in separate files: the generated
 * file is overwritten wholesale by `scripts/import-confessions.ts`, so anything
 * written by hand has to live where a re-import cannot destroy it.
 */
export const CARDS: readonly Card[] = [
  ...(scriptureCards as Card[]),
  ...(doctrineCards as Card[]),
  ...(generatedDoctrineCards as Card[]),
  ...(historyEarly as Card[]),
  ...(historyModern as Card[]),
  ...(historyPeople as Card[]),
  ...(historyWorld as Card[]),
];

const VERSES = feedVerses as Record<string, string>;

/** Verse text for a cited reference, from the eager tier-one slice. */
export function lookupVerses(ref: Ref): string | undefined {
  return VERSES[refKey(ref)];
}

export const renderContext: RenderContext = {
  lookupVerses,
  sources: SOURCES_BY_ID,
};

export function toRendered(card: Card): RenderedCard {
  return renderCard(card, renderContext);
}
