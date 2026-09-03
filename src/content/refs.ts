/**
 * Pure reference algebra: no display names, no data files, and — deliberately —
 * no runtime imports at all. The build scripts run under plain Node, which
 * requires explicit file extensions on ESM imports, so any module shared
 * between the app and `scripts/` has to be loadable on its own. Keeping this a
 * leaf lets the build and the app share one definition of a verse key instead
 * of each hand-rolling one that can drift.
 */

import type { Ref } from './types';

/** Canonical key for a reference: "PSA.46.10", "ROM.8.38-39". */
export function refKey(ref: Ref): string {
  const end = ref.verseEnd != null && ref.verseEnd !== ref.verseStart ? `-${ref.verseEnd}` : '';
  return `${ref.book}.${ref.chapter}.${ref.verseStart}${end}`;
}

/** "10" for a single verse, "38-39" for a range. */
export function formatVerseRange(ref: Ref): string {
  return ref.verseEnd != null && ref.verseEnd !== ref.verseStart
    ? `${ref.verseStart}–${ref.verseEnd}`
    : String(ref.verseStart);
}
