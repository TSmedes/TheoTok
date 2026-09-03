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

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE_DIR = join(ROOT, 'node_modules', '.cache', 'theotok', 'creeds');
const OUT = join(ROOT, 'src', 'content', 'cards', 'doctrine.generated.json');

const BASE = 'https://raw.githubusercontent.com/NonlinearFruit/Creeds.json/master/creeds';

/** Kept in step with src/content/schema.ts. */
const BODY_MAX = 400;
const PROMPT_MAX = 120;
/** Below this a "card" is a fragment rather than a thought. */
const BODY_MIN = 25;

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
 * Caps are a balance decision, not a technical one. Structured public-domain
 * data for this material is overwhelmingly Reformed and Baptist, so importing
 * everything available would bury the other traditions and make their filters
 * feel empty. The remaining traditions are covered by hand-written cards in
 * doctrine.json.
 */
const PLANS: Plan[] = [
  { file: 'westminster_shorter_catechism', sourceId: 'wsc', traditions: ['reformed'], cap: 70, slug: 'wsc' },
  { file: 'heidelberg_catechism', sourceId: 'heidelberg', traditions: ['reformed'], cap: 55, slug: 'heid' },
  { file: 'westminster_confession_of_faith', sourceId: 'wcf', traditions: ['reformed'], cap: 38, slug: 'wcf' },
  { file: 'belgic_confession_of_faith', sourceId: 'belgic', traditions: ['reformed'], cap: 26, slug: 'belgic' },
  { file: 'canons_of_dort', sourceId: 'dort', traditions: ['reformed'], cap: 22, slug: 'dort' },
  { file: 'catechism_for_young_children', sourceId: 'young-children', traditions: ['reformed'], cap: 28, slug: 'cyc' },
  { file: 'london_baptist_1689', sourceId: 'lbcf-1689', traditions: ['baptist'], cap: 42, slug: 'lbcf' },
  { file: 'keachs_catechism', sourceId: 'keach', traditions: ['baptist'], cap: 40, slug: 'keach' },
  { file: 'apostles_creed', sourceId: 'apostles-creed', traditions: ['ecumenical'], cap: 6, slug: 'apostles' },
  { file: 'nicene_creed', sourceId: 'nicene-creed', traditions: ['ecumenical'], cap: 6, slug: 'nicene' },
  { file: 'athanasian_creed', sourceId: 'athanasian-creed', traditions: ['ecumenical'], cap: 8, slug: 'athanasian' },
  { file: 'chalcedonian_definition', sourceId: 'chalcedon', traditions: ['ecumenical'], cap: 4, slug: 'chalcedon' },
  { file: 'council_of_orange', sourceId: 'council-of-orange', traditions: ['ecumenical'], cap: 18, slug: 'orange' },
];

interface Candidate {
  locus: string;
  prompt?: string;
  body: string;
  title?: string;
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
      out.push({
        locus: String(item.Number),
        prompt: tidy(item.Question),
        body: tidy(item.Answer),
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
  if (body.length <= BODY_MAX) return [body];

  const sentences = body.match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) ?? [body];
  let chunks = pack(sentences);

  // Some of this material predates the full stop as a structural device. The
  // Definition of Chalcedon is a single 1,200-character sentence, so sentence
  // splitting alone drops it entirely; its semicolons separate genuinely
  // self-contained clauses, and are the next honest boundary down.
  if (chunks.some((c) => c.length > BODY_MAX)) {
    chunks = chunks.flatMap((c) =>
      c.length <= BODY_MAX ? [c] : pack(c.split(/;\s*/).map((part, i, all) => (i < all.length - 1 ? `${part};` : part))),
    );
  }

  // Anything still oversized is one unbroken clause; drop it rather than
  // truncating someone's confession mid-sentence.
  return chunks.filter((c) => c.length <= BODY_MAX);
}

/** Greedily fills chunks up to the cap, never splitting a piece. */
function pack(pieces: string[]): string[] {
  const chunks: string[] = [];
  let current = '';
  for (const piece of pieces) {
    const trimmed = piece.trim();
    if (!trimmed) continue;
    const candidate = current ? `${current} ${trimmed}` : trimmed;
    if (candidate.length > BODY_MAX && current) {
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

async function main() {
  const refresh = process.argv.includes('--refresh');
  const cards: unknown[] = [];
  const report: string[] = [];

  for (const plan of PLANS) {
    const doc = await fetchCreed(plan.file, refresh);
    const all = candidates(doc);

    const expanded: Candidate[] = [];
    for (const c of all) {
      if (c.prompt != null) {
        // Catechism Q&A: keep whole or not at all.
        if (c.body.length <= BODY_MAX && c.prompt.length <= PROMPT_MAX) expanded.push(c);
        continue;
      }
      const parts = chunk(c.body);
      parts.forEach((body, i) => {
        expanded.push({
          ...c,
          body,
          // Say so when a card is an excerpt, so the citation stays honest.
          locus:
            parts.length > 1
              ? [c.locus, `part ${i + 1} of ${parts.length}`].filter(Boolean).join(', ')
              : c.locus,
        });
      });
    }

    const usable = expanded.filter((c) => c.body.length >= BODY_MIN);

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
      cards.push(card);
    }

    report.push(
      `  ${plan.file.padEnd(34)} ${String(chosen.length).padStart(3)} cards ` +
        `(of ${usable.length} usable / ${all.length} total)`,
    );
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
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
