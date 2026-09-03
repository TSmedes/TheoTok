import {
  mountedCount,
  spacerAfter,
  spacerBefore,
  windowFor,
  type PageWindow,
} from '../windowing';

const OVERSCAN = 3;
const PAGE = 800;

function totalHeight(range: PageWindow, total: number, pageHeight: number): number {
  return (
    spacerBefore(range, pageHeight) +
    mountedCount(range) * pageHeight +
    spacerAfter(range, total, pageHeight)
  );
}

describe('windowFor', () => {
  it('keeps overscan pages either side in the middle of a long feed', () => {
    expect(windowFor(50, 896, OVERSCAN)).toEqual({ start: 47, end: 53 });
  });

  it('clamps at the start without mounting negative indices', () => {
    expect(windowFor(0, 896, OVERSCAN)).toEqual({ start: 0, end: 3 });
    expect(windowFor(1, 896, OVERSCAN)).toEqual({ start: 0, end: 4 });
  });

  it('clamps at the end without running past the last page', () => {
    expect(windowFor(895, 896, OVERSCAN)).toEqual({ start: 892, end: 895 });
  });

  it('clamps an out-of-range index rather than producing an empty window', () => {
    expect(windowFor(5000, 896, OVERSCAN)).toEqual({ start: 892, end: 895 });
    expect(windowFor(-20, 896, OVERSCAN)).toEqual({ start: 0, end: 3 });
  });

  it('handles a feed shorter than the window', () => {
    expect(windowFor(0, 2, OVERSCAN)).toEqual({ start: 0, end: 1 });
    expect(mountedCount(windowFor(0, 2, OVERSCAN))).toBe(2);
  });

  it('reports an empty window for an empty feed', () => {
    const range = windowFor(0, 0, OVERSCAN);
    expect(mountedCount(range)).toBe(0);
  });
});

describe('scroll geometry is preserved', () => {
  /**
   * The invariant the whole approach rests on. If the spacers and the mounted
   * pages ever add up to something other than the full height, scrollHeight
   * changes as the window slides and the feed jumps under the reader.
   */
  it('always occupies exactly the height of the full sequence', () => {
    const total = 896;
    for (let index = 0; index < total; index++) {
      const range = windowFor(index, total, OVERSCAN);
      expect(totalHeight(range, total, PAGE)).toBe(total * PAGE);
    }
  });

  it('holds for short feeds and odd overscans too', () => {
    for (const total of [1, 2, 5, 7, 8, 50]) {
      for (const overscan of [0, 1, 3, 10]) {
        for (let index = 0; index < total; index++) {
          const range = windowFor(index, total, overscan);
          expect(totalHeight(range, total, PAGE)).toBe(total * PAGE);
        }
      }
    }
  });

  it('mounts far fewer pages than the feed holds', () => {
    const range = windowFor(400, 896, OVERSCAN);
    expect(mountedCount(range)).toBe(7);
  });

  it('costs nothing before the page height is measured', () => {
    // First paint and server rendering both run with a height of zero; the
    // spacers must collapse rather than reserving bogus space.
    const range = windowFor(0, 896, OVERSCAN);
    expect(totalHeight(range, 896, 0)).toBe(0);
    expect(spacerBefore(range, 0)).toBe(0);
    expect(spacerAfter(range, 896, 0)).toBe(0);
  });

  it('never produces a negative spacer', () => {
    for (const total of [0, 1, 4, 896]) {
      for (let index = -5; index < total + 5; index++) {
        const range = windowFor(index, total, OVERSCAN);
        expect(spacerBefore(range, PAGE)).toBeGreaterThanOrEqual(0);
        expect(spacerAfter(range, total, PAGE)).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
