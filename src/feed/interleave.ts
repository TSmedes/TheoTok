/**
 * Type interleaving.
 *
 * A purely random shuffle regularly deals five catechism answers in a row,
 * which reads as a malfunction even though it is correct. This pass reorders
 * enough to break up runs without making the order predictable.
 *
 * Getting both properties at once turned out to be the whole difficulty, and
 * the two obvious approaches each fail one of them:
 *
 *  - Repairing runs locally (pulling or swapping in the nearest card of another
 *    type) keeps the shuffle's randomness, but every repair takes a card of a
 *    different type from further down the list. The scarce types drain toward
 *    the front and the majority type piles up at the end, producing runs of
 *    five or six in the tail — measured, not hypothesised.
 *  - Always drawing from the type with the most cards left keeps the buckets
 *    balanced and caps runs at two, because balance is what prevents a
 *    one-type tail.
 *
 * So this draws from the largest bucket, which supplies the cap, and breaks
 * ties at random, which supplies the variety: deterministic tie-breaking is
 * what produced the mechanical "Doctrine, Scripture, Doctrine, Scripture..."
 * rotation, not the largest-first rule itself.
 *
 * `SLACK` widens "largest" to "within one of the largest". Over 400 seeds on a
 * realistic mix, slack 0 held the cap but gave only 95 distinct twelve-card
 * openings; slack 1 held the cap and gave 266. Slack 2 let runs reach three.
 */

/** How far below the largest bucket a type can be and still be picked. */
const SLACK = 1;

/**
 * Reorders so no more than `maxRun` consecutive items share a type.
 *
 * `rand` must be a seeded PRNG, so a feed built from a known seed stays
 * reproducible. Where the remaining items make the cap impossible — the tail of
 * a pool that has only one type left — it accepts the run rather than stalling.
 * A pool filtered down to a single type is a legitimate state, not an error.
 */
export function interleaveByType<T>(
  items: readonly T[],
  typeOf: (item: T) => string,
  rand: () => number,
  maxRun = 2,
): T[] {
  if (items.length <= maxRun) return [...items];

  // Buckets preserve the shuffle's order within each type, so curation weights
  // still carry through.
  //
  // Held as parallel arrays indexed by bucket rather than a Map of queues, and
  // drained with a cursor rather than `shift()`. Shifting the majority bucket
  // once per output item is an O(n) memmove inside an O(n) loop, which on a
  // library where one type holds ~84% of the cards is the whole cost of the
  // pass. A cursor makes each draw O(1).
  const order: string[] = [];
  const lists: T[][] = [];
  const cursors: number[] = [];
  const indexOfType = new Map<string, number>();
  for (const item of items) {
    const type = typeOf(item);
    let bucket = indexOfType.get(type);
    if (bucket === undefined) {
      bucket = order.length;
      indexOfType.set(type, bucket);
      order.push(type);
      lists.push([]);
      cursors.push(0);
    }
    lists[bucket].push(item);
  }

  const out: T[] = [];
  // Reused across iterations: the pass runs once per card, and two throwaway
  // arrays per card is thousands of allocations for nothing.
  const eligible: number[] = [];
  const contenders: number[] = [];
  let runBucket = -1;
  let runLength = 0;

  while (out.length < items.length) {
    eligible.length = 0;
    let largest = 0;
    for (let bucket = 0; bucket < order.length; bucket += 1) {
      const remaining = lists[bucket].length - cursors[bucket];
      if (remaining === 0) continue;
      if (runLength >= maxRun && bucket === runBucket) continue;
      eligible.push(bucket);
      if (remaining > largest) largest = remaining;
    }

    let choice: number;
    if (eligible.length === 0) {
      // Only the current run's own type is left.
      choice = runBucket;
    } else {
      contenders.length = 0;
      for (const bucket of eligible) {
        if (lists[bucket].length - cursors[bucket] >= largest - SLACK) contenders.push(bucket);
      }
      choice = contenders[Math.floor(rand() * contenders.length)];
    }

    out.push(lists[choice][cursors[choice]]);
    cursors[choice] += 1;

    if (choice === runBucket) {
      runLength += 1;
    } else {
      runBucket = choice;
      runLength = 1;
    }
  }

  return out;
}

/** Longest run of consecutive equal types. Used by tests and diagnostics. */
export function longestRun<T>(items: readonly T[], typeOf: (item: T) => string): number {
  let best = 0;
  let current = 0;
  let previous: string | undefined;
  for (const item of items) {
    const type = typeOf(item);
    current = type === previous ? current + 1 : 1;
    previous = type;
    if (current > best) best = current;
  }
  return best;
}
