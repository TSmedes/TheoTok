/**
 * Build-time only. Downloads the King James Version + Apocrypha once and
 * normalises it into one compact JSON file per book.
 *
 * Running this at build time rather than in the app is the whole point: the
 * shipped app makes no network calls, so the feed works on a plane and no
 * upstream API can take it down.
 *
 * Source: Free Use Bible API (bible.helloao.org), serving ebible.org's
 * `eng-kjv` edition. The KJV text is public domain.
 *
 *   node scripts/build-bible.ts [--refresh]
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { BOOKS } from '../src/content/books.ts';
import { syncWebBible } from './sync-web-bible.ts';

const TRANSLATION = 'eng_kja';
const SOURCE_URL = `https://bible.helloao.org/api/${TRANSLATION}/complete.simple.json`;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'src', 'content', 'bible', 'kjv');
const MAP_FILE = join(ROOT, 'src', 'content', 'bible', 'bookMap.generated.ts');
const CACHE = join(ROOT, 'node_modules', '.cache', 'theotok', `${TRANSLATION}.json`);

interface Span {
  start: number;
  end: number;
}
interface SimpleVerse {
  type: string;
  number?: number;
  text?: string;
  /** Red-letter ranges, as offsets into `text`. */
  wordsOfJesus?: Span[];
}
interface SimpleChapter {
  number: number;
  content: SimpleVerse[];
}
/** The complete-translation payload wraps each chapter with audio metadata. */
interface ChapterEnvelope {
  chapter: SimpleChapter;
}
interface SimpleBook {
  id: string;
  name: string;
  chapters: ChapterEnvelope[];
}

/** What lands on disk, one file per book. Mirrors src/content/bible/types.ts. */
interface BibleBook {
  id: string;
  name: string;
  chapters: Record<string, Record<string, string>>;
  subtitles?: Record<string, string>;
}

async function loadSource(refresh: boolean): Promise<{ books: SimpleBook[] }> {
  if (!refresh && existsSync(CACHE)) {
    console.log(`Using cached download: ${CACHE}`);
    return JSON.parse(readFileSync(CACHE, 'utf8'));
  }
  console.log(`Downloading ${SOURCE_URL} ...`);
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
  const text = await res.text();
  mkdirSync(dirname(CACHE), { recursive: true });
  writeFileSync(CACHE, text);
  console.log(`Downloaded ${(text.length / 1e6).toFixed(1)} MB`);
  return JSON.parse(text);
}

/**
 * Repairs a known defect in the upstream "simple" payload: where a verse
 * contains red-letter text, flattening the structured runs into one string
 * drops the space at each quotation boundary ("And he said unto me,My grace
 * ... perfect in weakness.Most gladly"). It affected ~705 places in this
 * edition.
 *
 * The `wordsOfJesus` offsets say exactly where those boundaries are, so the
 * spaces go back precisely rather than being guessed at with a regex — which
 * would have to decide on its own whether any given "punctuation then capital"
 * is a real defect. Insertions run right-to-left so earlier offsets stay valid,
 * and must happen before any other rewriting, since stripping pilcrows or
 * collapsing whitespace would invalidate the offsets.
 */
function cleanVerse(block: SimpleVerse): string {
  let text = block.text ?? '';

  const boundaries = new Set<number>();
  for (const span of block.wordsOfJesus ?? []) {
    boundaries.add(span.start);
    boundaries.add(span.end);
  }

  const descending = [...boundaries].sort((a, b) => b - a);
  for (const at of descending) {
    if (at <= 0 || at >= text.length) continue;
    // Only where a word actually runs into the next one.
    if (/\s/.test(text[at - 1]) || /\s/.test(text[at])) continue;
    text = `${text.slice(0, at)} ${text.slice(at)}`;
  }

  return (
    text
      // The KJV's pilcrows mark paragraph starts in print, and read as noise on a card.
      .replace(/¶\s*/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function normalise(book: SimpleBook): BibleBook {
  const chapters: BibleBook['chapters'] = {};
  const subtitles: Record<string, string> = {};

  for (const envelope of book.chapters) {
    const chapter = envelope.chapter;
    const verses: Record<string, string> = {};
    for (const block of chapter.content) {
      if (block.type === 'verse' && block.number != null && block.text) {
        verses[String(block.number)] = cleanVerse(block);
      } else if (block.type === 'hebrew_subtitle' && block.text) {
        subtitles[String(chapter.number)] = block.text.trim();
      }
    }
    chapters[String(chapter.number)] = verses;
  }

  const out: BibleBook = { id: book.id, name: book.name, chapters };
  if (Object.keys(subtitles).length > 0) out.subtitles = subtitles;
  return out;
}

/**
 * Metro cannot resolve a `require` of a computed path, so the per-book requires
 * have to be written out one at a time. Generating the file keeps it in step
 * with the book list automatically.
 */
function writeBookMap() {
  const identifier = /^[A-Za-z_$][\w$]*$/;
  const entries = BOOKS.map((b) => {
    const key = identifier.test(b.id) ? b.id : JSON.stringify(b.id);
    return `  ${key}: () => require('./kjv/${b.id}.json') as BibleBook,`;
  }).join('\n');

  const lines = [
    '// Generated by scripts/build-bible.ts. Do not edit by hand.',
    "import type { BookId } from '../books';",
    "import type { BibleBook } from './types';",
    '',
    '/**',
    ' * Native only. `require` is lazy per module in Metro, so a book is parsed the',
    ' * first time it is actually opened rather than at startup. The web build',
    ' * fetches the same files from `public/` instead — see loader.web.ts.',
    ' */',
    'export const BOOK_FILES: Record<BookId, () => BibleBook> = {',
    entries,
    '};',
    '',
  ];
  writeFileSync(MAP_FILE, lines.join('\n'));
}

async function main() {
  const refresh = process.argv.includes('--refresh');
  const source = await loadSource(refresh);

  const byId = new Map(source.books.map((b) => [b.id, b]));

  // Fail loudly rather than shipping a Bible with holes in it.
  const missing = BOOKS.filter((b) => !byId.has(b.id)).map((b) => b.id);
  if (missing.length > 0) {
    throw new Error(`Source is missing ${missing.length} expected book(s): ${missing.join(', ')}`);
  }

  mkdirSync(OUT_DIR, { recursive: true });

  let totalBytes = 0;
  let totalVerses = 0;
  let totalChapters = 0;

  for (const meta of BOOKS) {
    const normalised = normalise(byId.get(meta.id)!);
    // Prefer our own display names over the source's, so citations stay consistent.
    normalised.name = meta.name;

    const json = JSON.stringify(normalised);
    writeFileSync(join(OUT_DIR, `${meta.id}.json`), json);

    totalBytes += json.length;
    totalChapters += Object.keys(normalised.chapters).length;
    totalVerses += Object.values(normalised.chapters).reduce((n, v) => n + Object.keys(v).length, 0);
  }

  writeBookMap();
  // Web reads the same books over HTTP from public/ — see sync-web-bible.ts.
  syncWebBible();

  console.log(
    `\nWrote ${BOOKS.length} books to src/content/bible/kjv/ (mirrored to public/bible/kjv/)` +
      `\n  chapters: ${totalChapters.toLocaleString()}` +
      `\n  verses:   ${totalVerses.toLocaleString()}` +
      `\n  size:     ${(totalBytes / 1e6).toFixed(2)} MB`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
