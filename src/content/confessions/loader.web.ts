import { CONFESSION_IDS } from './confessionIds.generated';
import type { ConfessionDocument } from './types';

/**
 * Web build. Documents are served as static files from `public/confessions/`
 * and fetched on demand, so the full text of thirty-five confessions never
 * enters the JS bundle. `doctrine.generated.json` is already 1.7 MB and eager;
 * the documents are larger still, and nobody reads one until they open a card
 * in context. Once fetched a document is cached for the session, and the
 * browser caches the file itself beyond that.
 *
 * Note this file imports the id list and not confessionMap.generated.ts —
 * that module's `require` calls would bundle every document and undo the point.
 */
const cache = new Map<string, ConfessionDocument>();
const inFlight = new Map<string, Promise<ConfessionDocument>>();

export async function loadConfession(sourceId: string): Promise<ConfessionDocument | null> {
  if (!CONFESSION_IDS.has(sourceId)) return null;

  const cached = cache.get(sourceId);
  if (cached) return cached;

  // Two cards opening the same confession at once should share one request.
  const existing = inFlight.get(sourceId);
  if (existing) return existing;

  const request = (async () => {
    const res = await fetch(`/confessions/${sourceId}.json`);
    if (!res.ok) throw new Error(`Could not load ${sourceId}: HTTP ${res.status}`);
    const document = (await res.json()) as ConfessionDocument;
    cache.set(sourceId, document);
    return document;
  })().finally(() => inFlight.delete(sourceId));

  inFlight.set(sourceId, request);
  return request;
}

/** Whether a source has a document at all, without loading it. */
export function hasConfession(sourceId: string): boolean {
  return CONFESSION_IDS.has(sourceId);
}
