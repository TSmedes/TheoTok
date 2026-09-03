import type { Card, ContentType, Tradition } from '@/content/types';

import {
  SELECTABLE_TRADITIONS,
  buildPool,
  buildSequence,
  matchesTraditions,
  type FeedPreferences,
} from '../buildPool';
import { interleaveByType, longestRun } from '../interleave';
import { mulberry32, weightedShuffle } from '../shuffle';

const ALL_TYPES: ContentType[] = ['scripture', 'history', 'doctrine'];

function card(id: string, type: ContentType, traditions: Tradition[], weight?: number): Card {
  const base = { id, traditions, themes: ['t'], ...(weight != null ? { weight } : {}) };
  if (type === 'scripture') {
    return { ...base, type, ref: { book: 'PSA', chapter: 1, verseStart: 1 } } as Card;
  }
  if (type === 'doctrine') {
    return { ...base, type, sourceId: 'wsc', locus: '1', body: 'b' } as Card;
  }
  return { ...base, type, headline: 'h', body: 'b', sourceId: 'foxe' } as Card;
}

const prefs = (over: Partial<FeedPreferences> = {}): FeedPreferences => ({
  traditions: [],
  types: ALL_TYPES,
  ...over,
});

/** The real library's mix, so the ordering tests exercise realistic ratios. */
function realisticMix() {
  return [
    ...Array.from({ length: 20 }, (_, i) => `a${i}`),
    ...Array.from({ length: 21 }, (_, i) => `b${i}`),
    ...Array.from({ length: 15 }, (_, i) => `c${i}`),
  ];
}

describe('mulberry32', () => {
  it('is deterministic for a given seed', () => {
    const seqA = Array.from({ length: 10 }, mulberry32(12345));
    const seqB = Array.from({ length: 10 }, mulberry32(12345));
    expect(seqA).toEqual(seqB);
  });

  it('produces different streams for different seeds', () => {
    expect(Array.from({ length: 10 }, mulberry32(1))).not.toEqual(
      Array.from({ length: 10 }, mulberry32(2)),
    );
  });

  it('stays within [0, 1)', () => {
    const rand = mulberry32(99);
    for (let i = 0; i < 5000; i++) {
      const v = rand();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('weightedShuffle', () => {
  const items = ['a', 'b', 'c', 'd', 'e'];

  it('is a permutation — never drops or duplicates an item', () => {
    for (let seed = 0; seed < 50; seed++) {
      const out = weightedShuffle(items, () => 1, mulberry32(seed));
      expect(out.length).toBe(items.length);
      expect([...out].sort()).toEqual([...items].sort());
    }
  });

  it('is deterministic for a given seed', () => {
    expect(weightedShuffle(items, () => 1, mulberry32(7))).toEqual(
      weightedShuffle(items, () => 1, mulberry32(7)),
    );
  });

  it('favours heavier items without guaranteeing them a slot', () => {
    const weights: Record<string, number> = { heavy: 10, light: 1 };
    let heavyFirst = 0;
    const runs = 400;
    for (let seed = 0; seed < runs; seed++) {
      const out = weightedShuffle(['heavy', 'light'], (i) => weights[i], mulberry32(seed));
      if (out[0] === 'heavy') heavyFirst++;
    }
    // 10:1 odds put the expectation near 91%; assert a bias, not an exact rate.
    expect(heavyFirst).toBeGreaterThan(runs * 0.75);
    expect(heavyFirst).toBeLessThan(runs);
  });

  it('handles a zero weight without producing NaN ordering', () => {
    const out = weightedShuffle(['a', 'b'], (i) => (i === 'a' ? 0 : 1), mulberry32(3));
    expect([...out].sort()).toEqual(['a', 'b']);
  });

  it('handles empty and single-item input', () => {
    expect(weightedShuffle([], () => 1, mulberry32(1))).toEqual([]);
    expect(weightedShuffle(['only'], () => 1, mulberry32(1))).toEqual(['only']);
  });
});

describe('interleaveByType', () => {
  const typeOf = (s: string) => s[0];
  const rand = (seed: number) => mulberry32((seed ^ 0x9e3779b9) >>> 0);

  it('caps runs at two for realistically shuffled input', () => {
    const items = realisticMix();
    for (let seed = 0; seed < 40; seed++) {
      const shuffled = weightedShuffle(items, () => 1, mulberry32(seed));
      const out = interleaveByType(shuffled, typeOf, rand(seed));
      expect(longestRun(out, typeOf)).toBeLessThanOrEqual(2);
      expect([...out].sort()).toEqual([...items].sort());
    }
  });

  it('keeps the tail mixed rather than piling up the majority type', () => {
    // The failure mode of local-repair strategies: they take a card of another
    // type from further down the list every time they fix a run, so the scarce
    // types drain to the front and the tail becomes one long run.
    const items = realisticMix();
    for (let seed = 0; seed < 40; seed++) {
      const shuffled = weightedShuffle(items, () => 1, mulberry32(seed));
      const out = interleaveByType(shuffled, typeOf, rand(seed));
      expect(longestRun(out.slice(-10), typeOf)).toBeLessThanOrEqual(2);
    }
  });

  it('does not fall into a mechanical rotation', () => {
    // Regression guard. Deterministic tie-breaking between equally plentiful
    // types produced a strict "b a b a b a..." rotation — capped, but entirely
    // predictable, and visible to a reader as the card colours cycling.
    const items = realisticMix();
    const openings = new Set<string>();
    let strictlyAlternating = 0;
    for (let seed = 0; seed < 60; seed++) {
      const shuffled = weightedShuffle(items, () => 1, mulberry32(seed));
      const out = interleaveByType(shuffled, typeOf, rand(seed));
      openings.add(out.slice(0, 12).map(typeOf).join(''));
      if (longestRun(out, typeOf) === 1) strictlyAlternating++;
    }
    expect(strictlyAlternating).toBe(0);
    expect(openings.size).toBeGreaterThan(20);
  });

  it('is deterministic for a given seed', () => {
    const items = realisticMix();
    const shuffled = weightedShuffle(items, () => 1, mulberry32(4));
    expect(interleaveByType(shuffled, typeOf, rand(4))).toEqual(
      interleaveByType(shuffled, typeOf, rand(4)),
    );
  });

  it('is a permutation', () => {
    const items = ['a1', 'a2', 'a3', 'b1', 'b2', 'c1'];
    const out = interleaveByType(items, typeOf, mulberry32(1));
    expect([...out].sort()).toEqual([...items].sort());
  });

  it('spends a scarce type where it breaks a run', () => {
    const out = interleaveByType(['a1', 'a2', 'a3', 'a4', 'b1'], typeOf, mulberry32(1));
    // Only one 'b' exists, so it has to land third to interrupt the a-run.
    expect(out[2]).toBe('b1');
    expect([...out].sort()).toEqual(['a1', 'a2', 'a3', 'a4', 'b1']);
  });

  it('accepts a long run when only one type exists, rather than stalling', () => {
    const items = ['a1', 'a2', 'a3', 'a4', 'a5'];
    const out = interleaveByType(items, typeOf, mulberry32(1));
    expect([...out].sort()).toEqual([...items].sort());
    expect(longestRun(out, typeOf)).toBe(5);
  });

  it('leaves short inputs alone', () => {
    expect(interleaveByType([], typeOf, mulberry32(1))).toEqual([]);
    expect(interleaveByType(['a1'], typeOf, mulberry32(1))).toEqual(['a1']);
    expect(interleaveByType(['a1', 'a2'], typeOf, mulberry32(1))).toEqual(['a1', 'a2']);
  });

  it('honours a custom maxRun', () => {
    const items = ['a1', 'a2', 'a3', 'a4', 'b1', 'b2', 'b3', 'b4'];
    const out = interleaveByType(items, typeOf, mulberry32(1), 1);
    expect(longestRun(out, typeOf)).toBe(1);
  });
});

describe('buildPool', () => {
  const cards: Card[] = [
    card('scr-a', 'scripture', ['ecumenical']),
    card('doc-b', 'doctrine', ['reformed']),
    card('doc-c', 'doctrine', ['catholic']),
    card('his-d', 'history', ['lutheran', 'anglican']),
  ];

  it('filters by content type', () => {
    const pool = buildPool(cards, prefs({ types: ['doctrine'] }));
    expect(pool.map((c) => c.id)).toEqual(['doc-b', 'doc-c']);
  });

  it('filters by tradition', () => {
    const pool = buildPool(cards, prefs({ traditions: ['catholic'] }));
    // The ecumenical card comes along; the Reformed and Lutheran ones do not.
    expect(pool.map((c) => c.id).sort()).toEqual(['doc-c', 'scr-a']);
  });

  it('matches a card that holds any one of the selected traditions', () => {
    const pool = buildPool(cards, prefs({ traditions: ['anglican'] }));
    expect(pool.map((c) => c.id).sort()).toEqual(['his-d', 'scr-a']);
  });

  it('treats no tradition selected as no tradition filter', () => {
    expect(buildPool(cards, prefs({ traditions: [] })).length).toBe(cards.length);
  });

  it('returns nothing when no content type is selected', () => {
    expect(buildPool(cards, prefs({ types: [] }))).toEqual([]);
  });

  it('never offers "ecumenical" as a selectable tradition', () => {
    expect(SELECTABLE_TRADITIONS).not.toContain('ecumenical');
    expect(SELECTABLE_TRADITIONS.length).toBe(7);
  });

  it('shows ecumenical cards to every tradition', () => {
    const creed = card('doc-creed', 'doctrine', ['ecumenical']);
    for (const tradition of SELECTABLE_TRADITIONS) {
      expect(matchesTraditions(creed, [tradition])).toBe(true);
    }
  });
});

describe('buildSequence', () => {
  const pool: Card[] = [
    card('scr-1', 'scripture', ['ecumenical']),
    card('scr-2', 'scripture', ['ecumenical']),
    card('scr-3', 'scripture', ['ecumenical']),
    card('doc-1', 'doctrine', ['reformed']),
    card('doc-2', 'doctrine', ['reformed']),
    card('his-1', 'history', ['ecumenical']),
  ];

  it('is deterministic for a given seed', () => {
    const a = buildSequence(pool, new Set(), 42);
    const b = buildSequence(pool, new Set(), 42);
    expect(a.sequence.map((c) => c.id)).toEqual(b.sequence.map((c) => c.id));
  });

  it('changes order for a different seed', () => {
    const a = buildSequence(pool, new Set(), 1).sequence.map((c) => c.id);
    const b = buildSequence(pool, new Set(), 999).sequence.map((c) => c.id);
    expect(a).not.toEqual(b);
  });

  it('excludes cards already seen', () => {
    const seen = new Set(['scr-1', 'doc-1']);
    const out = buildSequence(pool, seen, 5);
    const ids = out.sequence.map((c) => c.id);
    expect(ids).not.toContain('scr-1');
    expect(ids).not.toContain('doc-1');
    expect(ids.length).toBe(4);
    expect(out.recycled).toBe(false);
  });

  it('never repeats a card before the pool is exhausted', () => {
    const out = buildSequence(pool, new Set(), 11);
    expect(new Set(out.sequence.map((c) => c.id)).size).toBe(out.sequence.length);
    expect(out.sequence.length).toBe(pool.length);
  });

  it('recycles the whole pool once everything has been seen', () => {
    const seen = new Set(pool.map((c) => c.id));
    const out = buildSequence(pool, seen, 3);
    expect(out.recycled).toBe(true);
    expect(out.sequence.length).toBe(pool.length);
  });

  it('does not claim to have recycled an empty pool', () => {
    expect(buildSequence([], new Set(), 1)).toEqual({ sequence: [], recycled: false });
  });

  it('breaks up type runs in the delivered sequence', () => {
    const many: Card[] = [
      ...Array.from({ length: 20 }, (_, i) => card(`scr-${i}`, 'scripture', ['ecumenical'])),
      ...Array.from({ length: 21 }, (_, i) => card(`doc-${i}`, 'doctrine', ['reformed'])),
      ...Array.from({ length: 15 }, (_, i) => card(`his-${i}`, 'history', ['ecumenical'])),
    ];
    for (let seed = 0; seed < 20; seed++) {
      const out = buildSequence(many, new Set(), seed);
      expect(longestRun(out.sequence, (c) => c.type)).toBeLessThanOrEqual(2);
      expect(out.sequence.length).toBe(many.length);
    }
  });
});
