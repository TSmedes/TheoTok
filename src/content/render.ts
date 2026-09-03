import { citationName } from './books';
import { formatVerseRange, refKey } from './refs';
import type { Card, RenderedCard, Ref, Source } from './types';

export { refKey } from './refs';

/** "Psalm 46:10", "Romans 8:38-39" (en dash). */
export function formatRef(ref: Ref): string {
  return `${citationName(ref.book)} ${ref.chapter}:${formatVerseRange(ref)}`;
}

/**
 * "Westminster Shorter Catechism, Q. 1" / "Eusebius, Ecclesiastical History, VI.39".
 *
 * The locus prefix lives on the source, not the card, so every card citing a
 * given work is punctuated the same way. Sources with irregular loci (a
 * patristic book-and-section, say) simply omit the prefix and the card supplies
 * the whole locus.
 */
export function formatSourceCitation(source: Source, locus?: string): string {
  const work = source.author ? `${source.author}, ${source.title}` : source.title;
  if (!locus) return work;
  const rendered = source.locusPrefix ? `${source.locusPrefix} ${locus}` : locus;
  return `${work}, ${rendered}`;
}

export interface RenderContext {
  /** Resolves a reference to its verse text. Backed by the eager feed-verses slice. */
  lookupVerses: (ref: Ref) => string | undefined;
  sources: ReadonlyMap<string, Source>;
}

function requireSource(sources: RenderContext['sources'], id: string): Source {
  const source = sources.get(id);
  if (!source) throw new Error(`Card references unknown source "${id}"`);
  return source;
}

/**
 * Card -> what the UI draws. Every variant difference is resolved here, so no
 * component downstream needs to branch on content type for anything but colour.
 */
export function renderCard(card: Card, ctx: RenderContext): RenderedCard {
  switch (card.type) {
    case 'scripture': {
      const text = card.display ?? ctx.lookupVerses(card.ref);
      if (!text) throw new Error(`Card "${card.id}" has no text for ${formatRef(card.ref)}`);
      const kjv = ctx.sources.get('kjv');
      return {
        id: card.id,
        type: 'scripture',
        body: text,
        citation: formatRef(card.ref),
        attribution: kjv?.title ?? 'King James Version',
        // No cue: a passage is for reading, not for answering. Turning the
        // reference into a memory test makes Scripture the one thing in the
        // feed you have to work for, which is the wrong way round.
      };
    }

    case 'doctrine': {
      const source = requireSource(ctx.sources, card.sourceId);
      return {
        id: card.id,
        type: 'doctrine',
        prompt: card.prompt,
        body: card.body,
        citation: formatSourceCitation(source, card.locus),
        attribution: source.year,
        // Only catechisms are already in question-and-answer form. A creed or a
        // confession article has no question to ask, so it is never withheld.
        cue: card.prompt,
        cueLabel: card.prompt ? 'QUESTION' : undefined,
      };
    }

    case 'history': {
      const source = requireSource(ctx.sources, card.sourceId);
      return {
        id: card.id,
        type: 'history',
        prompt: card.headline,
        body: card.body,
        citation: formatSourceCitation(source, card.locus),
        // The date shown is when it happened, not when the source was written.
        attribution: card.yearDisplay ?? (card.year != null ? String(card.year) : undefined),
        cue: card.headline,
        cueLabel: 'WHAT HAPPENED?',
      };
    }
  }
}
