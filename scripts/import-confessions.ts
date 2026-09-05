/**
 * Build-time only. Turns public-domain creeds, confessions and catechisms into
 * doctrine cards.
 *
 * Importing rather than transcribing is a correctness decision as much as a
 * speed one: at this volume, hand-typing catechism answers from memory would
 * quietly introduce misquotations into a library whose entire promise is
 * rigorous citation.
 *
 * Source: github.com/NonlinearFruit/Creeds.json, which carries a
 * `SourceAttribution` of "Public Domain" on every document used here and cites
 * a scan for each. Texts are taken verbatim; only selection is ours.
 *
 *   node scripts/import-confessions.ts [--refresh]
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { analyse, cleanExcerpt, substance, ELISION_BUDGET } from '../src/content/excerpt.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE_DIR = join(ROOT, 'node_modules', '.cache', 'theotok', 'creeds');
const OUT = join(ROOT, 'src', 'content', 'cards', 'doctrine.generated.json');

/**
 * Tier two for doctrine, mirroring what the Bible does with whole books: the
 * complete text of every document, one file per source, loaded only when the
 * reader opens a card in context.
 *
 * The cards in OUT are a filtered, chunked selection — a catechism answer over
 * BODY_MAX is dropped rather than truncated, and long articles are split into
 * "part 2 of 3" excerpts. That is right for a feed and wrong for reading in
 * context, where the reader wants the confession as it was written. So the
 * documents here are written from `candidates()` before any of that happens:
 * full length, nothing dropped, in document order.
 */
const DOCS_DIR = join(ROOT, 'src', 'content', 'confessions');
const DOCS_MAP = join(DOCS_DIR, 'confessionMap.generated.ts');
/**
 * The bare list of ids, separate from the map because the map's `require`
 * calls would pull every document into the web bundle — the one thing loading
 * documents on demand exists to prevent. Both platforms import this; only
 * native imports the map.
 */
const DOCS_IDS = join(DOCS_DIR, 'confessionIds.generated.ts');

const BASE = 'https://raw.githubusercontent.com/NonlinearFruit/Creeds.json/master/creeds';

/** Kept in step with src/content/schema.ts. */
const BODY_MAX = 400;
const PROMPT_MAX = 120;
/** Below this a "card" is a fragment rather than a thought. */
const BODY_MIN = 25;
/**
 * The same floor for an excerpt, which has to clear a higher bar. A whole
 * article can be one short sentence and still stand — Zwingli's theses are
 * exactly that — but a *piece* of an article this short is what the cut left
 * over, not what it was aiming at.
 */
const EXCERPT_MIN = 35;
/**
 * What chunking may actually use. Every excerpt is run through `cleanExcerpt`
 * afterwards, which can add a leading ellipsis, a trailing one and a completed
 * pair of quotation marks; packing to the full BODY_MAX would push those cards
 * past the schema limit.
 */
const CHUNK_MAX = BODY_MAX - ELISION_BUDGET;

interface Plan {
  /** File name in the upstream repo, without .json. */
  file: string;
  /** Our source id, which must exist in sources/sources.json. */
  sourceId: string;
  traditions: string[];
  /** How many cards to take, at most. */
  cap: number;
  /** Slug used in generated card ids. */
  slug: string;
}

/**
 * Caps removed per 2026-09-04 Decision 1 (no balancing, import all usable).
 * All plans now use cap 9999 which stride treats as "all usable" — high-quality uncapped.
 * Weighting per Decision 4: impactful new cards will be curated with weight 1.2–1.5 via hand file or later plan weight field.
 */
const PLANS: Plan[] = [
  // Existing 13 (previously capped, now 9999)
  { file: 'westminster_shorter_catechism', sourceId: 'wsc', traditions: ['reformed'], cap: 9999, slug: 'wsc' },
  { file: 'heidelberg_catechism', sourceId: 'heidelberg', traditions: ['reformed'], cap: 9999, slug: 'heid' },
  { file: 'westminster_confession_of_faith', sourceId: 'wcf', traditions: ['reformed'], cap: 9999, slug: 'wcf' },
  { file: 'belgic_confession_of_faith', sourceId: 'belgic', traditions: ['reformed'], cap: 9999, slug: 'belgic' },
  { file: 'canons_of_dort', sourceId: 'dort', traditions: ['reformed'], cap: 9999, slug: 'dort' },
  { file: 'catechism_for_young_children', sourceId: 'young-children', traditions: ['reformed'], cap: 9999, slug: 'cyc' },
  { file: 'london_baptist_1689', sourceId: 'lbcf-1689', traditions: ['baptist'], cap: 9999, slug: 'lbcf' },
  { file: 'keachs_catechism', sourceId: 'keach', traditions: ['baptist'], cap: 9999, slug: 'keach' },
  { file: 'apostles_creed', sourceId: 'apostles-creed', traditions: ['ecumenical'], cap: 9999, slug: 'apostles' },
  { file: 'nicene_creed', sourceId: 'nicene-creed', traditions: ['ecumenical'], cap: 9999, slug: 'nicene' },
  { file: 'athanasian_creed', sourceId: 'athanasian-creed', traditions: ['ecumenical'], cap: 9999, slug: 'athanasian' },
  { file: 'chalcedonian_definition', sourceId: 'chalcedon', traditions: ['ecumenical'], cap: 9999, slug: 'chalcedon' },
  { file: 'council_of_orange', sourceId: 'council-of-orange', traditions: ['ecumenical'], cap: 9999, slug: 'orange' },
  // A2 Reformed additions (full usable per RESOURCE_EXPANSION.md)
  { file: 'westminster_larger_catechism', sourceId: 'wlc', traditions: ['reformed'], cap: 9999, slug: 'wlc' },
  { file: 'second_helvetic_confession', sourceId: 'second-helvetic', traditions: ['reformed'], cap: 9999, slug: 'helv2' },
  { file: 'french_confession_of_faith', sourceId: 'french-confession', traditions: ['reformed'], cap: 9999, slug: 'french' },
  { file: 'scots_confession', sourceId: 'scots-confession', traditions: ['reformed'], cap: 9999, slug: 'scots' },
  { file: 'consensus_tigurinus', sourceId: 'consensus-tigurinus', traditions: ['reformed'], cap: 9999, slug: 'tigurinus' },
  { file: 'tetrapolitan_confession', sourceId: 'tetrapolitan', traditions: ['reformed'], cap: 9999, slug: 'tetra' },
  { file: 'zwinglis_67_articles', sourceId: 'zwingli-67', traditions: ['reformed'], cap: 9999, slug: 'z67' },
  { file: 'zwinglis_fidei_ratio', sourceId: 'zwingli-fidei', traditions: ['reformed'], cap: 9999, slug: 'fidei' },
  { file: 'first_helvetic_confession', sourceId: 'first-helvetic', traditions: ['reformed'], cap: 9999, slug: 'helv1' },
  { file: 'first_confession_of_basel', sourceId: 'first-basel', traditions: ['reformed'], cap: 9999, slug: 'basel1' },
  { file: 'waldensian_confession', sourceId: 'waldensian', traditions: ['reformed'], cap: 9999, slug: 'walden' },
  { file: 'ten_theses_of_berne', sourceId: 'berne-theses', traditions: ['reformed'], cap: 9999, slug: 'berne' },
  { file: 'abstract_of_principles', sourceId: 'abstract-principles', traditions: ['baptist'], cap: 9999, slug: 'abstract' },
  { file: 'matthew_henrys_scripture_catechism', sourceId: 'matthew-henry', traditions: ['reformed'], cap: 9999, slug: 'mhenry' },
  { file: 'puritan_catechism', sourceId: 'puritan-catechism', traditions: ['reformed'], cap: 9999, slug: 'puritan' },
  { file: 'exposition_of_the_assemblies_catechism', sourceId: 'assemblies-exposition', traditions: ['reformed'], cap: 9999, slug: 'assemblies' },
  { file: 'shorter_catechism_explained', sourceId: 'shorter-explained', traditions: ['reformed'], cap: 9999, slug: 'shorter-exp' },
  { file: '1695_baptist_catechism', sourceId: 'baptist-catechism', traditions: ['baptist'], cap: 9999, slug: 'bap1695' },
  // Single-para ecumenical creeds (1 card each)
  { file: 'gregorys_declaration_of_faith', sourceId: 'gregory-declaration', traditions: ['ecumenical'], cap: 9999, slug: 'gregory' },
  { file: 'irenaeus_rule_of_faith', sourceId: 'irenaeus-rule', traditions: ['ecumenical'], cap: 9999, slug: 'irenaeus' },
  { file: 'tertullians_rule_of_faith', sourceId: 'tertullian-rule', traditions: ['ecumenical'], cap: 9999, slug: 'tertullian' },
  { file: 'ignatius_creed', sourceId: 'ignatius-creed', traditions: ['ecumenical'], cap: 9999, slug: 'ignatius' },
];

interface Candidate {
  locus: string;
  prompt?: string;
  body: string;
  title?: string;
  /**
   * Position in the unfiltered document, assigned before any length filtering
   * or chunking. Cards carry it as `docIndex` so the reader can find the entry
   * a card came from without parsing loci — they come in too many shapes
   * ("1", "1.2", "IV", "1.1, part 2 of 3") to sort or match reliably.
   */
  index?: number;
}

async function fetchCreed(file: string, refresh: boolean): Promise<any> {
  const path = join(CACHE_DIR, `${file}.json`);
  if (!refresh && existsSync(path)) return JSON.parse(readFileSync(path, 'utf8'));

  const res = await fetch(`${BASE}/${file}.json`);
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  const text = await res.text();
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(path, text);
  return JSON.parse(text);
}

function tidy(text: string): string {
  return text
    .replace(/\[\d+\]/g, '') // proof-text markers, e.g. "my own,[1] but"
    .replace(/\s+/g, ' ')
    .trim();
}

/** Flattens the four upstream shapes into one list of candidate cards. */
function candidates(doc: any): Candidate[] {
  const format = doc?.Metadata?.CreedFormat;
  const data = doc?.Data;
  const out: Candidate[] = [];

  if (format === 'Creed') {
    // One block of prose; each paragraph stands alone as a card.
    const content: string = data?.Content ?? '';
    const paragraphs = content
      .split(/\n\s*\n/)
      .map(tidy)
      .filter(Boolean);
    paragraphs.forEach((body, i) =>
      // A creed printed as one paragraph has no article number worth citing;
      // its cards are identified purely by which excerpt they are.
      out.push({ locus: paragraphs.length > 1 ? String(i + 1) : '', body }),
    );
    return out;
  }

  if (!Array.isArray(data)) return out;

  for (const item of data) {
    if (item.Question != null && item.Answer != null) {
      // A handful of upstream entries — three in the 1695 Baptist Catechism —
      // leave `Answer` empty and carry the text only in `AnswerWithProofs`.
      // Taking that instead loses nothing: `tidy` strips the proof markers,
      // which is all the two fields differ by.
      const answer = item.Answer || item.AnswerWithProofs || '';
      out.push({
        locus: String(item.Number),
        prompt: tidy(item.Question),
        body: tidy(answer),
      });
    } else if (item.Content != null && item.Article != null) {
      out.push({
        locus: String(item.Article),
        title: item.Title ? tidy(item.Title) : undefined,
        body: tidy(item.Content),
      });
    } else if (Array.isArray(item.Sections)) {
      for (const section of item.Sections) {
        if (section?.Content == null) continue;
        out.push({
          locus: `${item.Chapter}.${section.Section}`,
          title: item.Title ? tidy(item.Title) : undefined,
          body: tidy(section.Content),
        });
      }
    }
  }
  return out;
}

/**
 * Splits prose too long for one card into coherent excerpts at sentence
 * boundaries, packing sentences until the next would overflow.
 *
 * Without this the Athanasian Creed and the Definition of Chalcedon produce no
 * cards at all — they are single long paragraphs — and the Belgic Confession
 * yields two articles out of thirty-seven. Dropping the ecumenical creeds
 * because of a layout constraint is not an acceptable trade.
 *
 * Only applied to continuous prose. A catechism answer is never split: severing
 * an answer from its question changes what it says.
 */
function chunk(body: string): string[] {
  if (body.length <= CHUNK_MAX) return [body];

  const sentences = body.match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) ?? [body];
  let chunks = pack(sentences);

  // Some of this material predates the full stop as a structural device. The
  // Definition of Chalcedon is a single 1,200-character sentence, so sentence
  // splitting alone drops it entirely; its semicolons separate genuinely
  // self-contained clauses, and are the next honest boundary down.
  if (chunks.some((c) => c.length > CHUNK_MAX)) {
    chunks = chunks.flatMap((c) =>
      c.length <= CHUNK_MAX ? [c] : pack(c.split(/;\s*/).map((part, i, all) => (i < all.length - 1 ? `${part};` : part))),
    );
  }

  // Anything still oversized is one unbroken clause; drop it rather than
  // truncating someone's confession mid-sentence.
  return heal(chunks.filter((c) => c.length <= CHUNK_MAX));
}

/**
 * Below this an excerpt is a phrase, not a thought. Tetrapolitan 18 quotes the
 * words of institution clause by clause, and splitting on those semicolons
 * yields cards reading only `"this is my body," etc.`
 */
const STANDALONE_MIN = 60;

/**
 * Rejoins neighbouring excerpts that should never have been separate: one that
 * stops mid-sentence, and one too short to say anything on its own. `pack`
 * fills greedily, so this recovers only what the semicolon pass over-cut — but
 * every card it recovers is one that carries a thought instead of a phrase.
 */
function heal(chunks: string[]): string[] {
  const out: string[] = [];
  for (const piece of chunks) {
    const previous = out[out.length - 1];
    if (previous == null || `${previous} ${piece}`.length > CHUNK_MAX) {
      out.push(piece);
      continue;
    }
    const orphaned =
      analyse(previous).endsMidSentence ||
      previous.length < STANDALONE_MIN ||
      piece.length < STANDALONE_MIN;
    if (orphaned) out[out.length - 1] = `${previous} ${piece}`;
    else out.push(piece);
  }
  return out;
}

/** Greedily fills chunks up to the cap, never splitting a piece. */
function pack(pieces: string[]): string[] {
  const chunks: string[] = [];
  let current = '';
  for (const piece of pieces) {
    const trimmed = piece.trim();
    if (!trimmed) continue;
    const candidate = current ? `${current} ${trimmed}` : trimmed;
    if (candidate.length > CHUNK_MAX && current) {
      chunks.push(current);
      current = trimmed;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/**
 * Spreads the selection across the whole document instead of taking the first
 * N. Otherwise a 33-chapter confession contributes only its opening chapters
 * and the feed never reaches anything past the doctrine of Scripture.
 */
function stride<T>(items: T[], cap: number): T[] {
  if (items.length <= cap) return items;
  const step = items.length / cap;
  const picked: T[] = [];
  for (let i = 0; i < cap; i++) picked.push(items[Math.floor(i * step)]);
  return picked;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

function themesFor(candidate: Candidate, plan: Plan): string[] {
  // Titles make genuinely useful themes; catechism Q&As have none, so they fall
  // back to the document. Themes are metadata for later — nothing filters on
  // them yet.
  const fromTitle = candidate.title ? slugify(candidate.title) : '';
  return fromTitle ? [fromTitle] : [plan.slug];
}

/**
 * Writes one source's complete document. Deliberately not filtered by BODY_MAX
 * and not run through `chunk()`: this is the text a reader reads, not a card.
 */
function writeDocument(plan: Plan, entries: Candidate[]): void {
  mkdirSync(DOCS_DIR, { recursive: true });

  const document = {
    sourceId: plan.sourceId,
    entries: entries.map((c) => {
      const entry: Record<string, unknown> = { locus: c.locus, body: c.body };
      if (c.title) entry.title = c.title;
      if (c.prompt) entry.prompt = c.prompt;
      return entry;
    }),
  };

  writeFileSync(join(DOCS_DIR, `${plan.sourceId}.json`), `${JSON.stringify(document, null, 2)}\n`);
}

/**
 * Native only, and the same trick `bookMap.generated.ts` plays for Scripture:
 * Metro evaluates a module on first `require`, so a confession is parsed when
 * someone opens it rather than at startup. The web build overrides the loader
 * and fetches from `public/` instead — see loader.web.ts.
 */
function writeDocumentMap(sourceIds: string[]): void {
  const entries = sourceIds
    .map((id) => `  ${JSON.stringify(id)}: () => require('./${id}.json') as ConfessionDocument,`)
    .join('\n');

  writeFileSync(
    DOCS_MAP,
    `// Generated by scripts/import-confessions.ts. Do not edit by hand.\n` +
      `import type { ConfessionDocument } from './types';\n\n` +
      `/**\n` +
      ` * Native only. \`require\` is lazy per module in Metro, so a confession is\n` +
      ` * parsed the first time it is actually opened rather than at startup. The web\n` +
      ` * build fetches the same files from \`public/\` instead — see loader.web.ts.\n` +
      ` */\n` +
      `export const CONFESSION_FILES: Record<string, () => ConfessionDocument> = {\n` +
      `${entries}\n};\n`,
  );

  writeFileSync(
    DOCS_IDS,
    `// Generated by scripts/import-confessions.ts. Do not edit by hand.\n\n` +
      `/**\n` +
      ` * Sources with an imported document, on both platforms. Separate from\n` +
      ` * confessionMap.generated.ts because that file's \`require\` calls would pull\n` +
      ` * every document into the web bundle.\n` +
      ` */\n` +
      `export const CONFESSION_IDS: ReadonlySet<string> = new Set([\n` +
      `${sourceIds.map((id) => `  ${JSON.stringify(id)},`).join('\n')}\n]);\n`,
  );
}

async function main() {
  const refresh = process.argv.includes('--refresh');
  const cards: unknown[] = [];
  const report: string[] = [];

  for (const plan of PLANS) {
    const doc = await fetchCreed(plan.file, refresh);
    const all = candidates(doc).map((c, i) => ({ ...c, index: i }));

    writeDocument(plan, all);

    const expanded: Candidate[] = [];
    for (const c of all) {
      if (c.prompt != null) {
        // Catechism Q&A: keep whole or not at all.
        if (c.body.length <= BODY_MAX && c.prompt.length <= PROMPT_MAX) {
          expanded.push({ ...c, body: cleanExcerpt(c.body) });
        }
        continue;
      }
      const parts = chunk(c.body);
      parts.forEach((body, i) => {
        expanded.push({
          ...c,
          // The excerpt the feed shows, repaired to stand on its own. The full
          // article goes to `writeDocument` untouched, above.
          body: cleanExcerpt(body, { elideStart: i > 0, elideEnd: i < parts.length - 1 }),
          // Say so when a card is an excerpt, so the citation stays honest.
          locus:
            parts.length > 1
              ? [c.locus, `part ${i + 1} of ${parts.length}`].filter(Boolean).join(', ')
              : c.locus,
        });
      });
    }

    // Measured on what the card says, not on the marks the repair added.
    const usable = expanded.filter(
      (c) => substance(c.body).length >= (c.locus?.includes('part ') ? EXCERPT_MIN : BODY_MIN),
    );

    const chosen = stride(usable, plan.cap);

    for (const c of chosen) {
      const card: Record<string, unknown> = {
        id: `doc-${plan.slug}-${slugify(c.locus) || 'whole'}`,
        type: 'doctrine',
        traditions: plan.traditions,
        themes: themesFor(c, plan),
        sourceId: plan.sourceId,
        body: c.body,
      };
      if (c.locus) card.locus = c.locus;
      if (c.prompt) card.prompt = c.prompt;
      if (c.index != null) card.docIndex = c.index;
      cards.push(card);
    }

    report.push(
      `  ${plan.file.padEnd(34)} ${String(chosen.length).padStart(3)} cards ` +
        `(of ${usable.length} usable / ${all.length} total)` +
        `  → ${String(all.length).padStart(3)} document entries`,
    );
  }

  writeDocumentMap(PLANS.map((p) => p.sourceId));

  // Repairing an excerpt can lengthen it. CHUNK_MAX reserves room for that, so
  // an overflow here means the reservation is wrong — fail the build rather
  // than write cards the schema will reject.
  const overlong = cards.filter((c) => (c as { body: string }).body.length > BODY_MAX);
  if (overlong.length > 0) {
    const worst = overlong.map((c) => `${(c as { id: string }).id} (${(c as { body: string }).body.length})`);
    throw new Error(`Cleaned bodies over ${BODY_MAX}: ${worst.join(', ')}`);
  }

  // Ids must be unique across the whole library; catch collisions here rather
  // than in the test suite.
  const ids = cards.map((c) => (c as { id: string }).id);
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (duplicates.length > 0) {
    throw new Error(`Duplicate generated ids: ${[...new Set(duplicates)].join(', ')}`);
  }

  writeFileSync(OUT, `${JSON.stringify(cards, null, 2)}\n`);
  console.log(`Imported ${cards.length} doctrine cards\n${report.join('\n')}`);
  console.log(`\nWrote ${OUT.replace(ROOT, '.')}`);
  console.log(`Wrote ${PLANS.length} documents to ${DOCS_DIR.replace(ROOT, '.')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
