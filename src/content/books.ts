/**
 * The canonical book list, in NRSV/KJV order, including the Apocrypha as printed in
 * the 1611 edition. This is the single source of truth: the app imports it for
 * types and citation rendering, and `scripts/build-bible.ts` imports it to know
 * what to fetch and in what order.
 *
 * IDs are USFM book codes.
 */

export type Section = 'ot' | 'apocrypha' | 'nt';

export interface BookMeta {
  readonly id: string;
  /** Title as it appears in a table of contents. */
  readonly name: string;
  /** Form used inside a citation, where it differs (Psalms -> "Psalm 23:1"). */
  readonly citationName?: string;
  readonly section: Section;
}

export const BOOKS = [
  // Old Testament
  { id: 'GEN', name: 'Genesis', section: 'ot' },
  { id: 'EXO', name: 'Exodus', section: 'ot' },
  { id: 'LEV', name: 'Leviticus', section: 'ot' },
  { id: 'NUM', name: 'Numbers', section: 'ot' },
  { id: 'DEU', name: 'Deuteronomy', section: 'ot' },
  { id: 'JOS', name: 'Joshua', section: 'ot' },
  { id: 'JDG', name: 'Judges', section: 'ot' },
  { id: 'RUT', name: 'Ruth', section: 'ot' },
  { id: '1SA', name: '1 Samuel', section: 'ot' },
  { id: '2SA', name: '2 Samuel', section: 'ot' },
  { id: '1KI', name: '1 Kings', section: 'ot' },
  { id: '2KI', name: '2 Kings', section: 'ot' },
  { id: '1CH', name: '1 Chronicles', section: 'ot' },
  { id: '2CH', name: '2 Chronicles', section: 'ot' },
  { id: 'EZR', name: 'Ezra', section: 'ot' },
  { id: 'NEH', name: 'Nehemiah', section: 'ot' },
  { id: 'EST', name: 'Esther', section: 'ot' },
  { id: 'JOB', name: 'Job', section: 'ot' },
  { id: 'PSA', name: 'Psalms', citationName: 'Psalm', section: 'ot' },
  { id: 'PRO', name: 'Proverbs', section: 'ot' },
  { id: 'ECC', name: 'Ecclesiastes', section: 'ot' },
  { id: 'SNG', name: 'Song of Solomon', section: 'ot' },
  { id: 'ISA', name: 'Isaiah', section: 'ot' },
  { id: 'JER', name: 'Jeremiah', section: 'ot' },
  { id: 'LAM', name: 'Lamentations', section: 'ot' },
  { id: 'EZK', name: 'Ezekiel', section: 'ot' },
  { id: 'DAN', name: 'Daniel', section: 'ot' },
  { id: 'HOS', name: 'Hosea', section: 'ot' },
  { id: 'JOL', name: 'Joel', section: 'ot' },
  { id: 'AMO', name: 'Amos', section: 'ot' },
  { id: 'OBA', name: 'Obadiah', section: 'ot' },
  { id: 'JON', name: 'Jonah', section: 'ot' },
  { id: 'MIC', name: 'Micah', section: 'ot' },
  { id: 'NAM', name: 'Nahum', section: 'ot' },
  { id: 'HAB', name: 'Habakkuk', section: 'ot' },
  { id: 'ZEP', name: 'Zephaniah', section: 'ot' },
  { id: 'HAG', name: 'Haggai', section: 'ot' },
  { id: 'ZEC', name: 'Zechariah', section: 'ot' },
  { id: 'MAL', name: 'Malachi', section: 'ot' },

  // Apocrypha / Deuterocanon, as printed in the 1611 KJV
  { id: '1ES', name: '1 Esdras', section: 'apocrypha' },
  { id: '2ES', name: '2 Esdras', section: 'apocrypha' },
  { id: 'TOB', name: 'Tobit', section: 'apocrypha' },
  { id: 'JDT', name: 'Judith', section: 'apocrypha' },
  { id: 'ESG', name: 'Rest of Esther', section: 'apocrypha' },
  { id: 'WIS', name: 'Wisdom of Solomon', citationName: 'Wisdom', section: 'apocrypha' },
  { id: 'SIR', name: 'Ecclesiasticus', citationName: 'Sirach', section: 'apocrypha' },
  { id: 'BAR', name: 'Baruch', section: 'apocrypha' },
  { id: 'S3Y', name: 'Song of the Three Children', section: 'apocrypha' },
  { id: 'SUS', name: 'Susanna', section: 'apocrypha' },
  { id: 'BEL', name: 'Bel and the Dragon', section: 'apocrypha' },
  { id: 'MAN', name: 'Prayer of Manasseh', section: 'apocrypha' },
  { id: '1MA', name: '1 Maccabees', section: 'apocrypha' },
  { id: '2MA', name: '2 Maccabees', section: 'apocrypha' },

  // New Testament
  { id: 'MAT', name: 'Matthew', section: 'nt' },
  { id: 'MRK', name: 'Mark', section: 'nt' },
  { id: 'LUK', name: 'Luke', section: 'nt' },
  { id: 'JHN', name: 'John', section: 'nt' },
  { id: 'ACT', name: 'Acts', section: 'nt' },
  { id: 'ROM', name: 'Romans', section: 'nt' },
  { id: '1CO', name: '1 Corinthians', section: 'nt' },
  { id: '2CO', name: '2 Corinthians', section: 'nt' },
  { id: 'GAL', name: 'Galatians', section: 'nt' },
  { id: 'EPH', name: 'Ephesians', section: 'nt' },
  { id: 'PHP', name: 'Philippians', section: 'nt' },
  { id: 'COL', name: 'Colossians', section: 'nt' },
  { id: '1TH', name: '1 Thessalonians', section: 'nt' },
  { id: '2TH', name: '2 Thessalonians', section: 'nt' },
  { id: '1TI', name: '1 Timothy', section: 'nt' },
  { id: '2TI', name: '2 Timothy', section: 'nt' },
  { id: 'TIT', name: 'Titus', section: 'nt' },
  { id: 'PHM', name: 'Philemon', section: 'nt' },
  { id: 'HEB', name: 'Hebrews', section: 'nt' },
  { id: 'JAS', name: 'James', section: 'nt' },
  { id: '1PE', name: '1 Peter', section: 'nt' },
  { id: '2PE', name: '2 Peter', section: 'nt' },
  { id: '1JN', name: '1 John', section: 'nt' },
  { id: '2JN', name: '2 John', section: 'nt' },
  { id: '3JN', name: '3 John', section: 'nt' },
  { id: 'JUD', name: 'Jude', section: 'nt' },
  { id: 'REV', name: 'Revelation', section: 'nt' },
] as const satisfies readonly BookMeta[];

export type BookId = (typeof BOOKS)[number]['id'];

const BY_ID = new Map<string, BookMeta>(BOOKS.map((b) => [b.id, b]));

export function bookMeta(id: BookId): BookMeta {
  const meta = BY_ID.get(id);
  if (!meta) throw new Error(`Unknown book id: ${id}`);
  return meta;
}

export function isBookId(id: string): id is BookId {
  return BY_ID.has(id);
}

/** The name to use inside a citation, e.g. "Psalm" rather than "Psalms". */
export function citationName(id: BookId): string {
  const meta = bookMeta(id);
  return meta.citationName ?? meta.name;
}
