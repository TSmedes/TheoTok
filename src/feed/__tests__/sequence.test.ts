import { clearSequence, extendSequence, poolKeyFor, sequenceFor } from '../sequence';

describe('poolKeyFor', () => {
  it('ignores the order filters were selected in', () => {
    expect(poolKeyFor(['catholic', 'reformed'], ['scripture', 'doctrine'])).toBe(
      poolKeyFor(['reformed', 'catholic'], ['doctrine', 'scripture']),
    );
  });

  it('distinguishes genuinely different filters', () => {
    expect(poolKeyFor(['catholic'], ['scripture'])).not.toBe(poolKeyFor(['lutheran'], ['scripture']));
    expect(poolKeyFor([], ['scripture'])).not.toBe(poolKeyFor([], ['scripture', 'doctrine']));
  });
});

describe('sequenceFor', () => {
  beforeEach(() => clearSequence());

  it('builds once and reuses the result for the same pool', () => {
    const build = jest.fn(() => ({ order: ['a', 'b', 'c'], recycled: false }));

    const first = sequenceFor('key-1', build);
    const second = sequenceFor('key-1', build);

    expect(build).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
    expect(second.order).toEqual(['a', 'b', 'c']);
  });

  it('survives the caller unmounting and asking again', () => {
    // This is the whole point: the tab navigator unmounts the feed, and coming
    // back must not draw a new order and lose the reader's place.
    sequenceFor('key-1', () => ({ order: ['a', 'b', 'c'], recycled: false }));
    const afterRemount = sequenceFor('key-1', () => ({ order: ['x', 'y', 'z'], recycled: false }));
    expect(afterRemount.order).toEqual(['a', 'b', 'c']);
  });

  it('rebuilds when the filters change', () => {
    sequenceFor('key-1', () => ({ order: ['a'], recycled: false }));
    const next = sequenceFor('key-2', () => ({ order: ['b'], recycled: false }));
    expect(next.order).toEqual(['b']);
    expect(next.poolKey).toBe('key-2');
  });

  it('records a cycle start only when the pool was recycled', () => {
    expect(sequenceFor('fresh', () => ({ order: ['a'], recycled: false })).cycleStarts).toEqual([]);
    clearSequence();
    expect(sequenceFor('reused', () => ({ order: ['a'], recycled: true })).cycleStarts).toEqual([0]);
  });
});

describe('extendSequence', () => {
  beforeEach(() => clearSequence());

  it('appends without disturbing what came before', () => {
    sequenceFor('key', () => ({ order: ['a', 'b'], recycled: false }));
    const extended = extendSequence({ order: ['c', 'd'], recycled: false });
    expect(extended?.order).toEqual(['a', 'b', 'c', 'd']);
  });

  it('marks where the appended pass starts a new cycle', () => {
    sequenceFor('key', () => ({ order: ['a', 'b', 'c'], recycled: false }));
    const extended = extendSequence({ order: ['a', 'b', 'c'], recycled: true });
    // The divider belongs at the seam, not at the top of the feed.
    expect(extended?.cycleStarts).toEqual([3]);
  });

  it('does nothing when there is no sequence to extend', () => {
    expect(extendSequence({ order: ['a'], recycled: false })).toBeNull();
  });

  it('keeps indices stable, so a remembered position still points at the same card', () => {
    const first = sequenceFor('key', () => ({ order: ['a', 'b', 'c'], recycled: false }));
    const at = 1;
    const card = first.order[at];
    const extended = extendSequence({ order: ['d', 'e'], recycled: false });
    expect(extended?.order[at]).toBe(card);
  });
});

describe('clearSequence', () => {
  it('forces the next call to rebuild', () => {
    sequenceFor('key', () => ({ order: ['a'], recycled: false }));
    clearSequence();
    const rebuilt = sequenceFor('key', () => ({ order: ['b'], recycled: false }));
    expect(rebuilt.order).toEqual(['b']);
  });
});
