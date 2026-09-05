/**
 * A confession, creed or catechism as it was written, rather than as the feed
 * excerpts it.
 *
 * Cards are the feed's unit: filtered to what fits on one, and split into
 * "part 2 of 3" pieces where an article runs long. A document is the reading
 * unit — every entry, at full length, in the order the work has them. See the
 * note on DOCS_DIR in scripts/import-confessions.ts.
 */
export interface ConfessionEntry {
  /** "1", "1.2", "IV" — the work's own numbering. Empty for single-paragraph creeds. */
  locus: string;
  /** Article title, where the work gives one. */
  title?: string;
  /** The question, for catechisms in Q&A form. */
  prompt?: string;
  body: string;
}

export interface ConfessionDocument {
  sourceId: string;
  /** Document order. A card's `docIndex` is a position in this array. */
  entries: ConfessionEntry[];
}
