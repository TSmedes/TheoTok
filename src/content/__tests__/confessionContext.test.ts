/**
 * The reader's context view, in the two parts that are pure enough to test
 * without mounting it: which slice of a document surrounds the cited entry, and
 * how an entry's locus is labelled once the work has already been named.
 *
 * The rest of the view is layout, but these two carry the bugs that would be
 * quiet — an off-by-one that hides the article the reader came for, or an
 * expander offered at a boundary where there is nothing left to show.
 */

import { CONFESSION_IDS } from '../confessions/confessionIds.generated';
import { ELLIPSIS } from '../excerpt';
import { WINDOW, contextWindow } from '../confessions/window';
import { CARDS, SOURCES_BY_ID } from '../library';
import { formatLocus, formatSourceCitation } from '../render';
import type { Source } from '../types';

describe('contextWindow', () => {
  it('centres on the cited entry when there is room either side', () => {
    const { from, to } = contextWindow(50, 200);
    expect(from).toBe(50 - WINDOW);
    expect(to).toBe(50 + WINDOW + 1);
  });

  it('always includes the cited entry itself', () => {
    for (const [current, total] of [
      [0, 1],
      [0, 200],
      [3, 200],
      [199, 200],
      [107, 108],
    ]) {
      const { from, to } = contextWindow(current, total);
      expect(from).toBeLessThanOrEqual(current);
      expect(to).toBeGreaterThan(current);
    }
  });

  it('does not run off either end of the document', () => {
    expect(contextWindow(1, 200)).toMatchObject({ from: 0, hasEarlier: false });
    expect(contextWindow(198, 200)).toMatchObject({ to: 200, hasLater: false });
  });

  it('offers to expand only where something is actually hidden', () => {
    expect(contextWindow(50, 200)).toMatchObject({ hasEarlier: true, hasLater: true });
    // A document shorter than the window has nothing to reveal at either end.
    expect(contextWindow(0, 3)).toMatchObject({ hasEarlier: false, hasLater: false });
  });

  it('expands each end independently, and to the whole work', () => {
    expect(contextWindow(50, 200, { before: true, after: false })).toMatchObject({
      from: 0,
      to: 56,
      hasEarlier: false,
      hasLater: true,
    });
    expect(contextWindow(50, 200, { before: false, after: true })).toMatchObject({
      from: 45,
      to: 200,
      hasEarlier: true,
      hasLater: false,
    });
    expect(contextWindow(50, 200, { before: true, after: true })).toMatchObject({
      from: 0,
      to: 200,
    });
  });

  it('still shows something when the index is out of range', () => {
    // Belt and braces against a card whose docIndex outlived a re-import.
    expect(contextWindow(999, 10)).toMatchObject({ from: 4, to: 10 });
    expect(contextWindow(-1, 10)).toMatchObject({ from: 0, to: 6 });
  });
});

describe('formatLocus', () => {
  const catechism = { locusPrefix: 'Q.' } as Source;
  const confession = {} as Source;

  it('applies the source’s prefix', () => {
    expect(formatLocus(catechism, '37')).toBe('Q. 37');
  });

  it('leaves an irregular locus to speak for itself', () => {
    expect(formatLocus(confession, '1.2')).toBe('1.2');
  });

  it('punctuates the locus the same way the full citation does', () => {
    const source = { title: 'Westminster Shorter Catechism', locusPrefix: 'Q.' } as Source;
    expect(formatSourceCitation(source, '37')).toBe(
      `Westminster Shorter Catechism, ${formatLocus(source, '37')}`,
    );
  });
});

describe('docIndex', () => {
  const doctrine = CARDS.filter((c) => c.type === 'doctrine');
  const withDocument = doctrine.filter((c) => CONFESSION_IDS.has(c.sourceId));

  it('is present on every card whose work was imported whole', () => {
    const missing = withDocument.filter((c) => c.docIndex == null);
    expect(missing.map((c) => c.id)).toEqual([]);
  });

  it('is absent on hand-written cards, which have no document to index into', () => {
    const stray = doctrine.filter((c) => !CONFESSION_IDS.has(c.sourceId) && c.docIndex != null);
    expect(stray.map((c) => c.id)).toEqual([]);
  });

  it('points inside its document', () => {
    // Loading every document here would be slow; a few representative works
    // covering each upstream shape is enough to catch an indexing mistake.
    for (const sourceId of ['wsc', 'heidelberg', 'wcf', 'belgic', 'chalcedon']) {
      const document = require(`../confessions/${sourceId}.json`) as { entries: unknown[] };
      const cards = withDocument.filter((c) => c.sourceId === sourceId);

      expect(cards.length).toBeGreaterThan(0);
      for (const card of cards) {
        expect(card.docIndex).toBeLessThan(document.entries.length);
      }
    }
  });

  it('resolves to an entry the card actually came from', () => {
    const document = require('../confessions/wsc.json') as {
      entries: { locus: string; prompt?: string }[];
    };

    for (const card of withDocument.filter((c) => c.sourceId === 'wsc')) {
      const entry = document.entries[card.docIndex!];
      // WSC is a catechism, so no card is an excerpt: locus and question match
      // the entry exactly.
      expect(entry.locus).toBe(card.locus);
      expect(entry.prompt).toBe(card.prompt);
    }
  });

  it('links excerpt cards back to the article they were cut from', () => {
    const document = require('../confessions/wcf.json') as { entries: { locus: string }[] };
    const excerpt = withDocument.find((c) => c.sourceId === 'wcf' && c.locus?.includes('part 2'));

    expect(excerpt).toBeDefined();
    // "1.1, part 2 of 3" is our label for a piece of article 1.1.
    expect(excerpt!.locus!.startsWith(document.entries[excerpt!.docIndex!].locus)).toBe(true);
  });
});

describe('confession documents', () => {
  it('cover every source they claim to', () => {
    for (const id of CONFESSION_IDS) {
      expect(SOURCES_BY_ID.has(id)).toBe(true);
    }
  });

  it('keep the text the cards had to drop', () => {
    // The point of importing documents separately: a catechism answer too long
    // for a card is still there to be read in context.
    const document = require('../confessions/heidelberg.json') as {
      entries: { body: string }[];
    };
    const longest = Math.max(...document.entries.map((e) => e.body.length));

    expect(document.entries.length).toBeGreaterThan(
      CARDS.filter((c) => c.type === 'doctrine' && c.sourceId === 'heidelberg').length,
    );
    expect(longest).toBeGreaterThan(400);
  });

  it('keep the text verbatim, with none of the repairs a card needs', () => {
    // Cards are trimmed and marked so they read alone; a document is what the
    // reader opens when the card is not enough, and must be the text as
    // written. An ellipsis here would mean the repair leaked into the source.
    const marked: string[] = [];
    for (const id of CONFESSION_IDS) {
      const document = require(`../confessions/${id}.json`) as {
        entries: { locus: string; body: string }[];
      };
      for (const entry of document.entries) {
        if (entry.body.includes(ELLIPSIS)) marked.push(`${id} ${entry.locus}`);
      }
    }
    expect(marked).toEqual([]);
  });
});
