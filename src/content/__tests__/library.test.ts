/**
 * The quality gate on the card library.
 *
 * 800+ cards cannot be eyeballed, and the failure modes are quiet ones: a
 * mistyped source id, a reference to a verse that does not exist, a body long
 * enough to fall off the bottom text tier and overflow the page. Each of those
 * ships looking fine and breaks one card somewhere in the middle of the feed.
 *
 * This runs in `npm test`, so every content batch is checked as it lands.
 */

import { BOOKS, isBookId } from '../books';
import { CARDS, SOURCES, SOURCES_BY_ID, lookupVerses, toRendered } from '../library';
import { formatRef, renderCard } from '../render';
import { refKey } from '../refs';
import {
  BODY_MAX_CHARS,
  ID_PREFIX,
  PROMPT_MAX_CHARS,
  cardsFileSchema,
  sourcesFileSchema,
} from '../schema';
import { CONTENT_TYPES, TRADITIONS, type Card } from '../types';

describe('sources', () => {
  it('every source matches the schema', () => {
    const result = sourcesFileSchema.safeParse(SOURCES);
    if (!result.success) {
      throw new Error(
        'Invalid sources:\n' +
          result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n'),
      );
    }
  });

  it('source ids are unique', () => {
    const seen = new Map<string, number>();
    for (const s of SOURCES) seen.set(s.id, (seen.get(s.id) ?? 0) + 1);
    expect([...seen.entries()].filter(([, n]) => n > 1)).toEqual([]);
  });

  it('covers every tradition, so no filter can come up empty-handed', () => {
    const covered = new Set(SOURCES.map((s) => s.tradition));
    expect([...TRADITIONS].filter((t) => !covered.has(t))).toEqual([]);
  });
});

describe('cards', () => {
  it('every card matches the schema', () => {
    const result = cardsFileSchema.safeParse(CARDS);
    if (!result.success) {
      const detail = result.error.issues
        .map((i) => {
          const index = typeof i.path[0] === 'number' ? i.path[0] : undefined;
          const id = index != null ? CARDS[index]?.id : undefined;
          return `  ${id ?? '?'} @ ${i.path.join('.')}: ${i.message}`;
        })
        .join('\n');
      throw new Error(`Invalid cards:\n${detail}`);
    }
  });

  it('card ids are unique across every file', () => {
    const seen = new Map<string, number>();
    for (const c of CARDS) seen.set(c.id, (seen.get(c.id) ?? 0) + 1);
    const duplicates = [...seen.entries()].filter(([, n]) => n > 1).map(([id]) => id);
    expect(duplicates).toEqual([]);
  });

  it('id prefix agrees with the card type', () => {
    const wrong = CARDS.filter((c) => !c.id.startsWith(`${ID_PREFIX[c.type]}-`)).map(
      (c) => `${c.id} is type "${c.type}"`,
    );
    expect(wrong).toEqual([]);
  });

  it('every cited source exists', () => {
    const missing: string[] = [];
    for (const card of CARDS) {
      if (card.type === 'scripture') continue;
      if (!SOURCES_BY_ID.has(card.sourceId)) missing.push(`${card.id} -> "${card.sourceId}"`);
    }
    expect(missing).toEqual([]);
  });

  it('has at least one card for every content type', () => {
    for (const type of CONTENT_TYPES) {
      expect(CARDS.filter((c) => c.type === type).length).toBeGreaterThan(0);
    }
  });

  it('has at least one card reachable from every tradition', () => {
    // 'ecumenical' cards match every filter, so a tradition is covered if it has
    // its own cards or if any ecumenical card exists.
    const ecumenical = CARDS.filter((c) => c.traditions.includes('ecumenical')).length;
    const uncovered = [...TRADITIONS].filter(
      (t) => t !== 'ecumenical' && CARDS.filter((c) => c.traditions.includes(t)).length === 0,
    );
    expect({ ecumenical: ecumenical > 0, uncovered }).toEqual({ ecumenical: true, uncovered: [] });
  });
});

describe('scripture references', () => {
  it('every book id in a reference is a real book', () => {
    const bad: string[] = [];
    for (const card of CARDS) {
      if (card.type === 'scripture' && !isBookId(card.ref.book)) bad.push(`${card.id}: ${card.ref.book}`);
      if (card.type === 'doctrine') {
        for (const ref of card.proofTexts ?? []) {
          if (!isBookId(ref.book)) bad.push(`${card.id}: ${ref.book}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('every scripture card resolves to real verse text', () => {
    const unresolved: string[] = [];
    for (const card of CARDS) {
      if (card.type !== 'scripture') continue;
      if (card.display) continue;
      if (!lookupVerses(card.ref)) {
        unresolved.push(`${card.id} (${formatRef(card.ref)} -> ${refKey(card.ref)})`);
      }
    }
    // A miss here almost always means build-feed-verses.ts needs re-running.
    expect(unresolved).toEqual([]);
  });

  it('every proof text resolves too', () => {
    const unresolved: string[] = [];
    for (const card of CARDS) {
      if (card.type !== 'doctrine') continue;
      for (const ref of card.proofTexts ?? []) {
        if (!lookupVerses(ref)) unresolved.push(`${card.id} -> ${formatRef(ref)}`);
      }
    }
    expect(unresolved).toEqual([]);
  });
});

describe('rendered output', () => {
  it('every card renders without throwing', () => {
    const failures: string[] = [];
    for (const card of CARDS) {
      try {
        toRendered(card);
      } catch (err) {
        failures.push(`${card.id}: ${(err as Error).message}`);
      }
    }
    expect(failures).toEqual([]);
  });

  it('every card renders a non-empty body and citation', () => {
    const bad: string[] = [];
    for (const card of CARDS) {
      const r = toRendered(card);
      if (!r.body.trim()) bad.push(`${card.id}: empty body`);
      if (!r.citation.trim()) bad.push(`${card.id}: empty citation`);
    }
    expect(bad).toEqual([]);
  });

  it('no rendered body exceeds the length the text tiers can fit', () => {
    const tooLong = CARDS.map((c) => toRendered(c))
      .filter((r) => r.body.length > BODY_MAX_CHARS)
      .map((r) => `${r.id}: ${r.body.length} chars`);
    expect(tooLong).toEqual([]);
  });

  it('renders citations in the expected shape', () => {
    const byId = new Map(CARDS.map((c) => [c.id, c]));

    const psalm = byId.get('scr-psa-46-10');
    expect(psalm && toRendered(psalm).citation).toBe('Psalm 46:10');

    const wsc = byId.get('doc-wsc-1');
    expect(wsc && toRendered(wsc).citation).toBe('Westminster Shorter Catechism, Q. 1');

    const origen = byId.get('his-origen-tortured');
    expect(origen && toRendered(origen).citation).toBe('Eusebius, Ecclesiastical History, VI.39');

    // Imported creeds carry a locus, since each article is its own card.
    const creed = byId.get('doc-apostles-1');
    expect(creed && toRendered(creed).citation).toBe("The Apostles' Creed, art. 1");

    const belgic = byId.get('doc-belgic-1');
    expect(belgic && toRendered(belgic).citation).toBe('The Belgic Confession, art. 1');

    // Prose too long for one card is excerpted, and the citation says so.
    const chalcedon = byId.get('doc-chalcedon-part-1-of-4');
    expect(chalcedon && toRendered(chalcedon).citation).toBe(
      'The Definition of Chalcedon, part 1 of 4',
    );
  });

  it('formats a verse range with an en dash', () => {
    expect(formatRef({ book: 'ROM', chapter: 8, verseStart: 38, verseEnd: 39 })).toBe('Romans 8:38–39');
    expect(formatRef({ book: 'PSA', chapter: 23, verseStart: 1 })).toBe('Psalm 23:1');
  });

  it('reports an unknown source rather than rendering a broken citation', () => {
    const card = {
      id: 'doc-nope-1',
      type: 'doctrine',
      traditions: ['reformed'],
      themes: ['x'],
      sourceId: 'does-not-exist',
      locus: '1',
      body: 'x',
    } satisfies Card;
    expect(() => renderCard(card, { lookupVerses, sources: SOURCES_BY_ID })).toThrow(
      /unknown source "does-not-exist"/,
    );
  });
});

describe('question-and-answer cues', () => {
  const byId = new Map(CARDS.map((c) => [c.id, c]));

  it('asks a catechism question and withholds its answer', () => {
    const wsc = byId.get('doc-wsc-1');
    const rendered = wsc && toRendered(wsc);
    expect(rendered?.cue).toBe('What is the chief end of man?');
    expect(rendered?.cueLabel).toBe('QUESTION');
  });

  it('never withholds Scripture — a passage is for reading, not answering', () => {
    const withCue = CARDS.filter((c) => c.type === 'scripture')
      .map((c) => toRendered(c))
      .filter((r) => r.cue != null)
      .map((r) => r.id);
    expect(withCue).toEqual([]);
  });

  it('leads a history card with its headline', () => {
    const card = byId.get('his-nicaea-scars');
    const rendered = card && toRendered(card);
    expect(rendered?.cue).toBe('The council met covered in scars.');
    expect(rendered?.cueLabel).toBe('WHAT HAPPENED?');
  });

  it('gives no cue to a creed — there is no question to ask of it', () => {
    const creed = byId.get('doc-apostles-1');
    const rendered = creed && toRendered(creed);
    expect(rendered?.cue).toBeUndefined();
  });

  it('leaves a good share of doctrine cards always visible', () => {
    // Confession articles and creeds have no question, so they render in full
    // even in test-me mode. If that share were zero the mode would swallow the
    // whole feed; if it were everything the mode would do nothing.
    const doctrine = CARDS.filter((c) => c.type === 'doctrine').map((c) => toRendered(c));
    const withCue = doctrine.filter((r) => r.cue != null).length;
    expect(withCue).toBeGreaterThan(0);
    expect(withCue).toBeLessThan(doctrine.length);
  });

  it('gives every history card something to ask', () => {
    const missing = CARDS.filter((c) => c.type === 'history')
      .map((c) => toRendered(c))
      .filter((r) => !r.cue)
      .map((r) => r.id);
    expect(missing).toEqual([]);
  });

  it('leaves most of the feed readable even in test-me mode', () => {
    // Scripture is the largest content type and is never withheld, so the mode
    // sharpens the feed rather than turning all of it into a quiz.
    const withheld = CARDS.map((c) => toRendered(c)).filter((r) => r.cue != null).length;
    expect(withheld).toBeGreaterThan(0);
    expect(withheld).toBeLessThan(CARDS.length / 2);
  });

  it('keeps cues short enough to read as a question', () => {
    const tooLong = CARDS.map((c) => toRendered(c))
      .filter((r) => r.cue != null && r.cue.length > PROMPT_MAX_CHARS)
      .map((r) => `${r.id}: ${r.cue!.length} chars`);
    expect(tooLong).toEqual([]);
  });
});

describe('the deuterocanon', () => {
  // Widened to string: this is a membership test against every book id, not
  // only the apocryphal ones.
  const APOCRYPHAL_BOOKS = new Set<string>(
    BOOKS.filter((b) => b.section === 'apocrypha').map((b) => b.id),
  );

  const deuterocanonical = CARDS.filter(
    (c) => c.type === 'scripture' && APOCRYPHAL_BOOKS.has(c.ref.book),
  );

  it('is present in the library', () => {
    expect(deuterocanonical.length).toBeGreaterThan(0);
  });

  it('reaches Catholic and Orthodox readers, and no one else', () => {
    // These cards carry their canon in their tradition tags rather than in a
    // separate setting: they are Scripture for these traditions, so they travel
    // with them.
    for (const card of deuterocanonical) {
      expect(card.traditions.sort()).toEqual(['catholic', 'orthodox']);
    }
  });

  it('is never tagged ecumenical, which would show it to everyone', () => {
    const ecumenical = deuterocanonical.filter((c) => c.traditions.includes('ecumenical'));
    expect(ecumenical.map((c) => c.id)).toEqual([]);
  });
});

describe('book list', () => {
  it('holds the 80 books of the KJV with Apocrypha', () => {
    expect(BOOKS.length).toBe(80);
    expect(BOOKS.filter((b) => b.section === 'ot').length).toBe(39);
    expect(BOOKS.filter((b) => b.section === 'apocrypha').length).toBe(14);
    expect(BOOKS.filter((b) => b.section === 'nt').length).toBe(27);
  });

  it('has unique book ids', () => {
    expect(new Set(BOOKS.map((b) => b.id)).size).toBe(BOOKS.length);
  });
});
