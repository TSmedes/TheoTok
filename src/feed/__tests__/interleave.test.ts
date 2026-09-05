import { interleaveByType, longestRun } from '../interleave';
import { mulberry32 } from '../shuffle';

/**
 * A pool shaped like the real library: doctrine dominates ~10:1, which is what
 * makes the ordering pass expensive and what makes its output worth pinning.
 */
function realisticMix(total: number): { id: number; type: string }[] {
  const items: { id: number; type: string }[] = [];
  let id = 0;
  const push = (type: string, n: number) => {
    for (let i = 0; i < n; i += 1) items.push({ id: (id += 1), type });
  };
  push('doctrine', Math.round(total * 0.84));
  push('scripture', Math.round(total * 0.12));
  push('history', Math.round(total * 0.04));
  return items;
}

describe('interleaveByType', () => {
  /**
   * A characterisation test, not a specification: it pins the exact permutation
   * the current implementation produces so the O(n^2) `shift()` can be replaced
   * with a cursor without silently changing the feed's running order. If this
   * fails after a rewrite, the rewrite altered the `rand()` call pattern.
   */
  it('produces a stable permutation for a fixed seed', () => {
    const items = realisticMix(200);
    const out = interleaveByType(items, (i) => i.type, mulberry32(12345));

    expect(out).toHaveLength(items.length);
    expect(out.map((i) => i.id).join(',')).toMatchSnapshot();
  });

  /**
   * Doctrine is ~84% of the library, so the minority types run out long before
   * the pool does and the tail is necessarily one long doctrine run — the
   * documented "accepts the run rather than stalling" case. What matters is the
   * opening, which is the only part a reader actually reaches in a session.
   */
  it('holds the run cap through the opening of a library-sized pool', () => {
    const items = realisticMix(4188);
    const out = interleaveByType(items, (i) => i.type, mulberry32(99));

    expect(out).toHaveLength(items.length);
    expect(longestRun(out.slice(0, 200), (i) => i.type)).toBeLessThanOrEqual(2);
  });

  it('runs the minority types out before it gives up on the cap', () => {
    const items = realisticMix(4188);
    const out = interleaveByType(items, (i) => i.type, mulberry32(99));

    // The tail is a single doctrine run; everything before it respects the cap.
    const tail = longestRun(out, (i) => i.type);
    expect(longestRun(out.slice(0, out.length - tail), (i) => i.type)).toBeLessThanOrEqual(2);
    expect(out.slice(out.length - tail).every((i) => i.type === 'doctrine')).toBe(true);
  });

  it('preserves the order within each type, so shuffle weighting carries through', () => {
    const items = realisticMix(300);
    const out = interleaveByType(items, (i) => i.type, mulberry32(7));

    for (const type of ['doctrine', 'scripture', 'history']) {
      const before = items.filter((i) => i.type === type).map((i) => i.id);
      const after = out.filter((i) => i.type === type).map((i) => i.id);
      expect(after).toEqual(before);
    }
  });

  it('accepts a run it cannot break, rather than stalling on a single-type pool', () => {
    const items = realisticMix(50).filter((i) => i.type === 'doctrine');
    const out = interleaveByType(items, (i) => i.type, mulberry32(1));

    expect(out).toHaveLength(items.length);
    expect(longestRun(out, (i) => i.type)).toBe(items.length);
  });
});
