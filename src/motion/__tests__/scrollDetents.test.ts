import { DETENTS_PER_PAGE, detentAt } from '../scrollDetents';

const PAGE = 800;

/** Every offset in [from, to) where the answer differs from the pixel before it. */
function crossings(from: number, to: number): number[] {
  const found: number[] = [];
  for (let y = from + 1; y < to; y += 1) {
    if (detentAt(y, PAGE) !== detentAt(y - 1, PAGE)) found.push(y);
  }
  return found;
}

describe('detentAt', () => {
  it('answers safely before the page has been measured', () => {
    expect(detentAt(0, 0)).toBe(0);
    expect(detentAt(500, 0)).toBe(0);
    expect(detentAt(500, -1)).toBe(0);
  });

  it('advances one detent per tenth of a page', () => {
    const start = detentAt(0, PAGE);
    expect(detentAt(PAGE / DETENTS_PER_PAGE, PAGE)).toBe(start + 1);
    expect(detentAt(PAGE, PAGE)).toBe(start + DETENTS_PER_PAGE);
    expect(detentAt(3 * PAGE, PAGE)).toBe(start + 3 * DETENTS_PER_PAGE);
  });

  it('fires exactly DETENTS_PER_PAGE times crossing a card', () => {
    expect(crossings(0, PAGE)).toHaveLength(DETENTS_PER_PAGE);
    expect(crossings(4 * PAGE, 5 * PAGE)).toHaveLength(DETENTS_PER_PAGE);
  });

  it('leaves the page boundary halfway between two detents', () => {
    // A landing must not be crowded by a Light tick a frame before it, so no
    // detent may change across the snap point itself.
    for (const boundary of [PAGE, 2 * PAGE, 9 * PAGE]) {
      expect(detentAt(boundary - 1, PAGE)).toBe(detentAt(boundary + 1, PAGE));
    }
  });

  it('goes backwards as smoothly as forwards', () => {
    // Scrolling up through a page should notch the same number of times as
    // scrolling down through it did.
    const down = crossings(0, PAGE);
    expect(down.map((y) => detentAt(y, PAGE))).toEqual(
      down.map((y) => detentAt(y, PAGE)).sort((a, b) => a - b),
    );
    expect(detentAt(-PAGE, PAGE)).toBe(detentAt(0, PAGE) - DETENTS_PER_PAGE);
  });
});
