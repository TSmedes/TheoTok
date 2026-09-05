import { CONFESSION_FILES } from './confessionMap.generated';
import { CONFESSION_IDS } from './confessionIds.generated';
import type { ConfessionDocument } from './types';

/**
 * The doctrine twin of `bible/loader.ts`: whole documents, loaded only when the
 * reader sheet opens. Native reads them straight out of the bundle — Metro
 * evaluates a module on first `require`, so a confession is parsed when it is
 * first opened rather than at startup. The web build overrides this file (see
 * loader.web.ts) and fetches from `public/` so the JS bundle stays small.
 *
 * Returns null for a source with no imported document — the hand-written cards
 * in `doctrine.json` cite works this pipeline never touched, and history cards
 * cite secondary sources with no text at all. Those have no context to show,
 * which is a fact about the library rather than an error.
 */
const cache = new Map<string, ConfessionDocument>();

export async function loadConfession(sourceId: string): Promise<ConfessionDocument | null> {
  const cached = cache.get(sourceId);
  if (cached) return cached;

  const file = CONFESSION_FILES[sourceId];
  if (!file) return null;

  const document = file();
  cache.set(sourceId, document);
  return document;
}

/** Whether a source has a document at all, without loading it. */
export function hasConfession(sourceId: string): boolean {
  return CONFESSION_IDS.has(sourceId);
}
