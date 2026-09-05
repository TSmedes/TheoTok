/**
 * Build NRSV Bible JSON per-book files from public GitHub sources.
 * Primary: Amosamevor/Bible-json NRSV 66 books (versions/en/NEW REVISED STANDARD VERSION.json)
 * Apocrypha: NRSV 5-book subset + KJV apocrypha fallback for remaining 9 to reach full 80 per src/content/books.ts.
 * Output: src/content/bible/nrsv/*.json + src/content/bible/bookMap.generated.ts updated to nrsv primary.
 * KJV fallback at src/content/bible/kjv/ is retained untouched.
 *
 * Run: node scripts/build-bible-nrsv.ts [--refresh]
 *
 * Personal use only — NRSV is copyrighted (National Council of Churches).
 */

import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BOOKS } from '../src/content/books.ts';
import { syncWebBible } from './sync-web-bible.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'src', 'content', 'bible', 'nrsv');
const MAP_FILE = join(ROOT, 'src', 'content', 'bible', 'bookMap.generated.ts');
const CACHE_DIR = join(ROOT, 'node_modules', '.cache', 'theotok');

const NRSV_URL = 'https://raw.githubusercontent.com/Amosamevor/Bible-json/main/versions/en/NEW%20REVISED%20STANDARD%20VERSION.json';
const NRSV_APOC_URL = 'https://raw.githubusercontent.com/Amosamevor/Bible-json/main/apocrypha-versions/NEW%20REVISED%20STANDARD%20VERSION.json';
const KJV_APOC_URL = 'https://raw.githubusercontent.com/Amosamevor/Bible-json/main/apocrypha-versions/KJV.json';

// Maps Amosamevor book names to BOOKS ids
const NAME_TO_ID: Record<string, string> = {
  'Genesis': 'GEN',
  'Exodus': 'EXO',
  'Leviticus': 'LEV',
  'Numbers': 'NUM',
  'Deuteronomy': 'DEU',
  'Joshua': 'JOS',
  'Judges': 'JDG',
  'Ruth': 'RUT',
  '1 Samuel': '1SA',
  '2 Samuel': '2SA',
  '1 Kings': '1KI',
  '2 Kings': '2KI',
  '1 Chronicles': '1CH',
  '2 Chronicles': '2CH',
  'Ezra': 'EZR',
  'Nehemiah': 'NEH',
  'Esther': 'EST',
  'Job': 'JOB',
  'Psalms': 'PSA',
  'Psalm': 'PSA',
  'Proverbs': 'PRO',
  'Ecclesiastes': 'ECC',
  'Song of Songs': 'SNG',
  'Song Of Solomon': 'SNG',
  'Song of Solomon': 'SNG',
  'Isaiah': 'ISA',
  'Jeremiah': 'JER',
  'Lamentations': 'LAM',
  'Lamentations of Jeremiah': 'LAM',
  'Ezekiel': 'EZK',
  'Daniel': 'DAN',
  'Hosea': 'HOS',
  'Joel': 'JOL',
  'Amos': 'AMO',
  'Obadiah': 'OBA',
  'Jonah': 'JON',
  'Micah': 'MIC',
  'Nahum': 'NAM',
  'Habakkuk': 'HAB',
  'Zephaniah': 'ZEP',
  'Haggai': 'HAG',
  'Zechariah': 'ZEC',
  'Malachi': 'MAL',
  'Matthew': 'MAT',
  'Mark': 'MRK',
  'Luke': 'LUK',
  'John': 'JHN',
  'Acts': 'ACT',
  'Acts of the Apostles': 'ACT',
  'Romans': 'ROM',
  '1 Corinthians': '1CO',
  '2 Corinthians': '2CO',
  'Galatians': 'GAL',
  'Ephesians': 'EPH',
  'Philippians': 'PHP',
  'Colossians': 'COL',
  '1 Thessalonians': '1TH',
  '2 Thessalonians': '2TH',
  '1 Timothy': '1TI',
  '2 Timothy': '2TI',
  'Titus': 'TIT',
  'Philemon': 'PHM',
  'Hebrews': 'HEB',
  'James': 'JAS',
  '1 Peter': '1PE',
  '2 Peter': '2PE',
  '1 John': '1JN',
  '2 John': '2JN',
  '3 John': '3JN',
  'Jude': 'JUD',
  'Revelation': 'REV',
  // Apocrypha
  'Tobit': 'TOB',
  'Judith': 'JDT',
  'Wisdom of Solomon': 'WIS',
  'Wisdom': 'WIS',
  'Ecclesiasticus (Sira)': 'SIR',
  'Sirach': 'SIR',
  'Baruch': 'BAR',
  'Epistle of Jeremiah': '__IGNORE__', // merged into BAR or ignored
  'Prayer of Azariah': 'S3Y',
  'Susanna': 'SUS',
  'Bel and the Dragon': 'BEL',
  'Prayer of Manasseh': 'MAN',
  '1 Maccabees': '1MA',
  '2 Maccabees': '2MA',
  '1 Esdras': '1ES',
  '2 Esdras': '2ES',
  'Esther (Greek)': 'ESG',
  'Rest of Esther': 'ESG',
};

async function fetchJson(url: string, cacheName: string, refresh: boolean): Promise<any> {
  const cachePath = join(CACHE_DIR, cacheName);
  if (!refresh && existsSync(cachePath)) {
    console.log(`Using cached ${cacheName}`);
    return JSON.parse(readFileSync(cachePath, 'utf8'));
  }
  console.log(`Downloading ${url} ...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${url}: HTTP ${res.status}`);
  const text = await res.text();
  mkdirSync(dirname(cachePath), { recursive: true });
  writeFileSync(cachePath, text);
  console.log(`Cached ${cacheName} ${(text.length/1e6).toFixed(2)} MB`);
  return JSON.parse(text);
}

function toBibleBook(id: string, name: string, chaptersIn: Record<string, Record<string, string>>): any {
  // chaptersIn is { "1": { "1": "text", ... } }
  const chapters: Record<string, Record<string, string>> = {};
  for (const [ch, verses] of Object.entries(chaptersIn)) {
    const v: Record<string, string> = {};
    for (const [vn, text] of Object.entries(verses as Record<string,string>)) {
      // Clean whitespace like KJV cleanVerse does
      const cleaned = (text as string).replace(/\s+/g, ' ').trim();
      if (cleaned) v[vn] = cleaned;
    }
    if (Object.keys(v).length > 0) chapters[ch] = v;
  }
  const meta = BOOKS.find(b => b.id === id);
  return { id, name: meta?.name ?? name, chapters };
}

function writeBookMap() {
  const identifier = /^[A-Za-z_$][\w$]*$/;
  const entries = BOOKS.map((b) => {
    const key = identifier.test(b.id) ? b.id : JSON.stringify(b.id);
    return `  ${key}: () => require('./nrsv/${b.id}.json') as BibleBook,`;
  }).join('\n');
  const lines = [
    '// Generated by scripts/build-bible-nrsv.ts. Do not edit by hand.',
    "import type { BookId } from '../books';",
    "import type { BibleBook } from './types';",
    '',
    '/**',
    ' * Native only. `require` is lazy per module in Metro, so a book is parsed the',
    ' * first time it is actually opened rather than at startup. The web build',
    ' * fetches the same files from `public/` instead — see loader.web.ts.',
    ' * Primary translation: NRSV (National Council of Churches). KJV retained at src/content/bible/kjv/ as fallback.',
    ' */',
    'export const BOOK_FILES: Record<BookId, () => BibleBook> = {',
    entries,
    '};',
    '',
  ];
  writeFileSync(MAP_FILE, lines.join('\n'));
  console.log(`Wrote ${MAP_FILE}`);
}

async function main() {
  const refresh = process.argv.includes('--refresh');
  const nrsv = await fetchJson(NRSV_URL, 'nrsv.json', refresh);
  const nrsvApoc = await fetchJson(NRSV_APOC_URL, 'nrsv-apoc.json', refresh);
  const kjvApoc = await fetchJson(KJV_APOC_URL, 'kjv-apoc.json', refresh);

  // Build combined map: bookName -> chapters
  const combined: Record<string, Record<string, Record<string,string>>> = {};
  // NRSV 66
  for (const [bookName, chapters] of Object.entries(nrsv)) {
    combined[bookName] = chapters as any;
  }
  // NRSV apocrypha 5 — overwrite where present (prefer NRSV apocrypha over KJV)
  for (const [bookName, chapters] of Object.entries(nrsvApoc)) {
    combined[bookName] = chapters as any;
  }
  // KJV apocrypha 15 — fill gaps only
  for (const [bookName, chapters] of Object.entries(kjvApoc)) {
    if (!combined[bookName]) {
      combined[bookName] = chapters as any;
    } else {
      // Special case: KJV has Epistle of Jeremiah separate; merge into Baruch if NRSV/KJV Baruch not covering it
      if (bookName === 'Epistle of Jeremiah' && combined['Baruch'] && !combined['Epistle of Jeremiah']) {
        // Skip — already have Baruch from NRSV; Epistle is letter, not needed for BOOKS.BAR
        continue;
      }
    }
  }

  // Map to BOOKS ids
  const byId: Record<string, Record<string, Record<string,string>>> = {};
  const missingNames: string[] = [];
  for (const [name, chapters] of Object.entries(combined)) {
    const id = NAME_TO_ID[name];
    if (!id) {
      missingNames.push(name);
      continue;
    }
    if (id === '__IGNORE__') continue;
    // If multiple names map to same id, merge chapters (e.g., Song variations)
    if (!byId[id]) byId[id] = {};
    // chapters is { "1": { "1": "text" } }
    for (const [ch, verses] of Object.entries(chapters as Record<string, Record<string,string>>)) {
      if (!byId[id][ch]) byId[id][ch] = {};
      Object.assign(byId[id][ch], verses);
    }
  }
  if (missingNames.length) console.warn(`Unmapped source book names: ${missingNames.join(', ')}`);

  // For apocrypha: Amosamevor NRSV apocrypha (5 books) is truncated vs KJV complete (missing e.g., 2MA 12:45).
  // Use complete KJV fallback for all 14 apocrypha for now (66 NRSV + 14 KJV) to ensure all refs resolve; swap to true NRSV apocrypha when full source sourced.
  const KJV_FALLBACK_IDS = new Set(['1ES','2ES','TOB','JDT','ESG','WIS','SIR','BAR','S3Y','SUS','BEL','MAN','1MA','2MA']);
  for (const id of KJV_FALLBACK_IDS) {
    const fallbackPath = join(ROOT, 'src', 'content', 'bible', 'kjv', `${id}.json`);
    if (existsSync(fallbackPath)) {
      const kjvBook = JSON.parse(readFileSync(fallbackPath, 'utf8'));
      const curVerses = byId[id] ? Object.values(byId[id]).reduce((n: number, v: any) => n + Object.keys(v).length, 0) : 0;
      const kjvVerses = Object.values(kjvBook.chapters).reduce((n: number, v: any) => n + Object.keys(v).length, 0);
      console.log(`Using complete KJV fallback for ${id} (${curVerses} -> ${kjvVerses} verses)`);
      byId[id] = kjvBook.chapters;
    }
  }

  const missingBooks = BOOKS.filter(b => !byId[b.id]).map(b => b.id);
  if (missingBooks.length > 0) {
    console.error(`Missing books for NRSV build: ${missingBooks.join(', ')}`);
    console.error(`Available ids: ${Object.keys(byId).sort().join(', ')}`);
    for (const id of [...missingBooks]) {
      const fallbackPath = join(ROOT, 'src', 'content', 'bible', 'kjv', `${id}.json`);
      if (existsSync(fallbackPath)) {
        console.log(`Using KJV fallback for ${id} from ${fallbackPath}`);
        const kjvBook = JSON.parse(readFileSync(fallbackPath, 'utf8'));
        byId[id] = kjvBook.chapters;
      }
    }
  }

  const finalMissing = BOOKS.filter(b => !byId[b.id]).map(b => b.id);
  if (finalMissing.length > 0) {
    throw new Error(`Still missing ${finalMissing.length} books after fallback: ${finalMissing.join(', ')}`);
  }

  mkdirSync(OUT_DIR, { recursive: true });

  let totalBytes = 0;
  let totalVerses = 0;
  let totalChapters = 0;

  for (const meta of BOOKS) {
    const chapters = byId[meta.id];
    const book = toBibleBook(meta.id, meta.name, chapters);
    const json = JSON.stringify(book);
    writeFileSync(join(OUT_DIR, `${meta.id}.json`), json);
    totalBytes += json.length;
    totalChapters += Object.keys(book.chapters).length;
    totalVerses += Object.values(book.chapters).reduce((n: number, v: any) => n + Object.keys(v).length, 0);
  }

  writeBookMap();

  // Sync web copy for nrsv
  // Reuse sync logic but for nrsv dir
  const WEB_DIR = join(ROOT, 'public', 'bible', 'nrsv');
  mkdirSync(WEB_DIR, { recursive: true });
  const { readdirSync, copyFileSync, statSync, rmSync } = await import('node:fs');
  const sources = readdirSync(OUT_DIR).filter(f => f.endsWith('.json'));
  const wanted = new Set(sources);
  for (const existing of readdirSync(WEB_DIR)) {
    if (!wanted.has(existing)) rmSync(join(WEB_DIR, existing), { recursive: true, force: true });
  }
  let copied = 0;
  for (const file of sources) {
    const from = join(OUT_DIR, file);
    const to = join(WEB_DIR, file);
    try {
      const a = statSync(from);
      const b = statSync(to);
      if (a.size === b.size && b.mtimeMs >= a.mtimeMs) continue;
    } catch {}
    copyFileSync(from, to);
    copied++;
  }
  console.log(`Synced ${copied} NRSV book(s) to public/bible/nrsv/`);

  // Also keep kjv web sync
  try { syncWebBible(); console.log('KJV web sync retained'); } catch(e){ console.warn('KJV sync warning', e); }

  console.log(`\nWrote ${BOOKS.length} books to src/content/bible/nrsv/`);
  console.log(`  chapters: ${totalChapters.toLocaleString()}`);
  console.log(`  verses:   ${totalVerses.toLocaleString()}`);
  console.log(`  size:     ${(totalBytes/1e6).toFixed(2)} MB`);
  console.log(`  Note: OT/NT 66 NRSV, Apocrypha 14 KJV fallback (complete) — NRSV apocrypha truncated, swap when full source sourced.`);
}

main().catch(err => { console.error(err); process.exit(1); });
