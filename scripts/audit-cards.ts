/**
 * Build-time only. Checks that every card reads as a whole thought on its own.
 *
 * A card is shown with no surrounding text, so an excerpt that opens on a
 * relative clause, closes on a comma, or carries one half of a quotation mark
 * asks the reader to supply context they do not have. `src/content/excerpt.ts`
 * repairs those at build time; this is the check that it did, and the report of
 * what could not be repaired because a whole sentence would not fit a card.
 *
 *   node scripts/audit-cards.ts [--strict]
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { analyse, hasLeadingMark, hasTrailingMark, ELLIPSIS } from '../src/content/excerpt.ts';
import { refKey } from '../src/content/refs.ts';

/** Kept in step with src/content/schema.ts. */
const BODY_MAX_CHARS = 400;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CARDS_DIR = join(ROOT, 'src', 'content', 'cards');

const FILES = [
  'scripture',
  'doctrine',
  'doctrine.generated',
  'history-early',
  'history-modern',
  'history-people',
  'history-world',
];

/**
 * Words that cannot begin a card. A sentence may legitimately open with "And"
 * or "For" — Scripture does it constantly — so this is advisory: it points at
 * cards worth a human's eye, not at cards that are wrong.
 */
const DANGLING = /^(which|whom|whose|thereof|therein|whereof|whereby|thereby)\b/i;

interface Row {
  id: string;
  body: string;
  reasons: string[];
}

function bodyOf(card: any, verses: Record<string, string>): string {
  if (card.type !== 'scripture') return card.body ?? '';
  return card.display ?? verses[refKey(card.ref)] ?? '';
}

function balanced(text: string): boolean {
  const flags = analyse(text);
  return flags.orphanOpeners.length === 0 && flags.orphanClosers.length === 0;
}

function main(): void {
  const strict = process.argv.includes('--strict');
  const verses = JSON.parse(
    readFileSync(join(ROOT, 'src', 'content', 'bible', 'feed-verses.json'), 'utf8'),
  ) as Record<string, string>;

  const cards: any[] = [];
  for (const name of FILES) {
    const path = join(CARDS_DIR, `${name}.json`);
    if (existsSync(path)) cards.push(...JSON.parse(readFileSync(path, 'utf8')));
  }

  const incoherent: Row[] = [];
  const advisory: Row[] = [];
  const overlong: Row[] = [];
  let elided = 0;

  for (const card of cards) {
    const body = bodyOf(card, verses);
    const reasons: string[] = [];

    if (!body) {
      incoherent.push({ id: card.id, body: '', reasons: ['no text'] });
      continue;
    }

    const flags = analyse(body);
    if (flags.startsMidSentence && !hasLeadingMark(body)) {
      reasons.push('opens mid-sentence with no leading mark');
    }
    if (flags.endsMidSentence && !hasTrailingMark(body)) {
      reasons.push('stops mid-sentence with no trailing mark');
    }
    if (!balanced(body)) reasons.push('unbalanced quote or bracket');
    if (body.length > BODY_MAX_CHARS) reasons.push(`${body.length} chars, over ${BODY_MAX_CHARS}`);

    if (reasons.length > 0) incoherent.push({ id: card.id, body, reasons });

    if (body.includes(ELLIPSIS)) {
      elided++;
      const stripped = body.replace(new RegExp(`^["“]?${ELLIPSIS}\\s*`), '');
      if (DANGLING.test(stripped)) {
        advisory.push({ id: card.id, body, reasons: ['opens on a clause with no antecedent'] });
      }
      // An excerpt marked at both ends is a slice of one sentence longer than a
      // card can hold. Report how much longer, so the cap can be revisited.
      if (hasLeadingMark(body) && hasTrailingMark(body)) {
        overlong.push({ id: card.id, body, reasons: [`${body.length} chars, both ends cut`] });
      }
    }
  }

  console.log(`Audited ${cards.length} cards. ${elided} carry an elision mark.`);

  console.log(`\nIncoherent: ${incoherent.length}`);
  for (const row of incoherent.slice(0, 40)) {
    console.log(`  ${row.id}: ${row.reasons.join('; ')}`);
    console.log(`     ${row.body.slice(0, 110)}`);
  }
  if (incoherent.length > 40) console.log(`  … and ${incoherent.length - 40} more`);

  console.log(`\nClause with no antecedent (advisory): ${advisory.length}`);
  for (const row of advisory.slice(0, 20)) console.log(`  ${row.id}: ${row.body.slice(0, 110)}`);
  if (advisory.length > 20) console.log(`  … and ${advisory.length - 20} more`);

  console.log(
    `\nCut at both ends — a whole sentence would not fit ${BODY_MAX_CHARS} chars: ${overlong.length}`,
  );
  const bySource = new Map<string, number>();
  for (const row of overlong) {
    const card = cards.find((c) => c.id === row.id);
    const key = card?.sourceId ?? card?.type ?? 'unknown';
    bySource.set(key, (bySource.get(key) ?? 0) + 1);
  }
  for (const [source, count] of [...bySource].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(4)}  ${source}`);
  }

  if (strict && incoherent.length > 0) process.exit(1);
}

main();
