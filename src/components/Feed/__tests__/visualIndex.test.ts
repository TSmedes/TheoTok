import { visualIndexFor } from '../visualIndex';

const PAGE = 800;

describe('visualIndexFor', () => {
  it('reports the page under the reader when settled on a snap point', () => {
    expect(visualIndexFor(0, PAGE)).toBe(0);
    expect(visualIndexFor(800, PAGE)).toBe(1);
    expect(visualIndexFor(4000, PAGE)).toBe(5);
  });

  it('flips at the halfway crossing, not on settle', () => {
    // The whole point of this module: mid-swipe, the incoming card becomes the
    // one being animated as soon as it owns most of the viewport.
    expect(visualIndexFor(399, PAGE)).toBe(0);
    expect(visualIndexFor(400, PAGE)).toBe(1);
    expect(visualIndexFor(401, PAGE)).toBe(1);
  });

  it('holds the current page through a small drag that will spring back', () => {
    expect(visualIndexFor(40, PAGE)).toBe(0);
    expect(visualIndexFor(840, PAGE)).toBe(1);
  });

  it('clamps a rubber-band overscroll above the first page', () => {
    // iOS reports a negative offset while the reader drags past the top.
    expect(visualIndexFor(-120, PAGE)).toBe(0);
    expect(visualIndexFor(-2000, PAGE)).toBe(0);
  });

  it('answers 0 before the feed has measured, rather than NaN', () => {
    expect(visualIndexFor(0, 0)).toBe(0);
    expect(visualIndexFor(500, 0)).toBe(0);
    expect(visualIndexFor(500, -10)).toBe(0);
  });

  it('agrees with the settled index at every snap point', () => {
    // The two indices answer different questions but must never disagree once
    // the feed is at rest, or a card would animate as active while the app
    // treats a different one as current.
    for (let i = 0; i < 50; i++) {
      expect(visualIndexFor(i * PAGE, PAGE)).toBe(i);
    }
  });
});
