/**
 * Seeded shuffling. The seed is deliberate rather than incidental: a feed built
 * from a known seed is reproducible, which is what makes the ordering testable
 * and a reported "this card came up twice" reproducible instead of folklore.
 */

/**
 * mulberry32 — a small, fast, well-distributed 32-bit PRNG. `Math.random()`
 * cannot be seeded, so it is no use here.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A weighted permutation, so a card curated as stronger surfaces earlier more
 * often without ever being guaranteed a slot.
 *
 * Uses the exponential race: draw a key of `-ln(U) / weight` per item and sort
 * ascending. Heavier items tend to draw smaller keys, and the result is a true
 * weighted sample without replacement — unlike repeatedly picking a weighted
 * winner and removing it, which is both slower and subtly biased when
 * implemented naively.
 */
export function weightedShuffle<T>(
  items: readonly T[],
  weightOf: (item: T) => number,
  rand: () => number,
): T[] {
  return items
    .map((item) => {
      const weight = Math.max(weightOf(item), Number.EPSILON);
      // rand() can return exactly 0; nudge it so log() stays finite.
      const u = Math.max(rand(), Number.EPSILON);
      return { item, key: -Math.log(u) / weight };
    })
    .sort((a, b) => a.key - b.key)
    .map(({ item }) => item);
}

/** A fresh seed for a new shuffle. */
export function randomSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}
