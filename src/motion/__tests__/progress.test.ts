import { motion } from '@/theme/tokens';

import { centreDistance, centreProgress, rampTo, textDrift } from '../progress';

const PAGE = 800;

describe('centreDistance', () => {
  it('is zero for the card the reader is on', () => {
    expect(centreDistance(0, 0, PAGE)).toBe(0);
    expect(centreDistance(7, 5600, PAGE)).toBe(0);
  });

  it('is positive for a card still below, negative for one scrolled past', () => {
    expect(centreDistance(1, 0, PAGE)).toBe(800);
    expect(centreDistance(0, 800, PAGE)).toBe(-800);
  });

  it('tracks a partial swipe', () => {
    expect(centreDistance(0, 200, PAGE)).toBe(-200);
    expect(centreDistance(1, 200, PAGE)).toBe(600);
  });
});

describe('centreProgress', () => {
  it('is 0 in view and 1 a full page away, either direction', () => {
    expect(centreProgress(0, 0, PAGE)).toBe(0);
    expect(centreProgress(0, 800, PAGE)).toBe(1);
    expect(centreProgress(1, 0, PAGE)).toBe(1);
  });

  it('ramps linearly across a swipe', () => {
    expect(centreProgress(0, 400, PAGE)).toBe(0.5);
    expect(centreProgress(1, 400, PAGE)).toBe(0.5);
  });

  it('clamps rather than running past 1 for distant cards', () => {
    // Cards several pages away must not scale or fade past their resting value.
    expect(centreProgress(9, 0, PAGE)).toBe(1);
    expect(centreProgress(0, 9999, PAGE)).toBe(1);
  });

  it('answers 0 before the feed has measured, rather than dividing by zero', () => {
    expect(centreProgress(3, 500, 0)).toBe(0);
  });
});

describe('textDrift', () => {
  it('is zero for the card in view, so nothing is displaced at rest', () => {
    // `toBeCloseTo` rather than `toBe`: negating zero yields -0, which is the
    // same offset but not the same value.
    expect(textDrift(0, 0, PAGE)).toBeCloseTo(0);
    expect(textDrift(4, 3200, PAGE)).toBeCloseTo(0);
  });

  it('trails behind a card moving up the screen', () => {
    // The card has moved a fifth of a page up; its text should still be a
    // little below where the card alone would have put it.
    const drift = textDrift(0, 160, PAGE);
    expect(drift).toBeGreaterThan(0);
    expect(drift).toBeCloseTo(160 * (1 - motion.parallax));
  });

  it('leads a card still approaching from below', () => {
    expect(textDrift(1, 0, PAGE)).toBeCloseTo(-800 * (1 - motion.parallax));
  });

  it('never displaces text further than the parallax fraction of a page', () => {
    // Otherwise a distant card's text would drift clean outside its own card.
    const full = Math.abs(textDrift(0, PAGE, PAGE));
    expect(full).toBeCloseTo(PAGE * (1 - motion.parallax));
    expect(full).toBeLessThan(PAGE);
  });

  it('answers 0 before the feed has measured', () => {
    expect(textDrift(2, 300, 0)).toBe(0);
  });
});

describe('rampTo', () => {
  it('is the identity value in view and the resting value a page away', () => {
    expect(rampTo(0, motion.restScale)).toBe(1);
    expect(rampTo(1, motion.restScale)).toBe(motion.restScale);
  });

  it('interpolates evenly in between', () => {
    expect(rampTo(0.5, 0.9)).toBeCloseTo(0.95);
    expect(rampTo(0.25, 0.4)).toBeCloseTo(0.85);
  });
});
