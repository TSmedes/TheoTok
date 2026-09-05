/**
 * Build-time citation lint — D2 enforcement.
 * Checks:
 *  - source.locusPrefix defined but card.locus missing
 *  - sourceId === 'schaff-history' && year > 1890 (anachronistic, Schaff died 1893)
 *
 * Run: npm run check:citations  or  node scripts/check-citations.ts [--strict]
 * Strict exits 1 on any violation; default warns but still exits 0 for incremental backfill.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const sources: any[] = JSON.parse(readFileSync(join(ROOT, 'src/content/sources/sources.json'), 'utf8'));
const byId = new Map(sources.map((s: any) => [s.id, s]));

const cardFiles = [
  'src/content/cards/history-early.json',
  'src/content/cards/history-modern.json',
  'src/content/cards/history-people.json',
  'src/content/cards/history-world.json',
  'src/content/cards/doctrine.json',
  'src/content/cards/doctrine.generated.json',
];

let missingLocus = 0;
let anachronistic = 0;
const details: string[] = [];

for (const rel of cardFiles) {
  const cards: any[] = JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
  for (const card of cards) {
    if (!card.sourceId) continue;
    const src = byId.get(card.sourceId);
    if (!src) continue;
    // locusPrefix but no locus
    if (src.locusPrefix && !card.locus) {
      missingLocus++;
      details.push(`missing locus: ${card.id} → ${card.sourceId} (${src.locusPrefix}) [${rel}]`);
    }
    // schaff anachronistic
    if (card.sourceId === 'schaff-history' && card.year != null && Number(card.year) > 1890) {
      // year may be string like "c. 1898", try parse int
      const y = parseInt(String(card.year).replace(/[^0-9]/g, ''), 10);
      if (!Number.isNaN(y) && y > 1890) {
        anachronistic++;
        details.push(`anachronistic schaff: ${card.id} year ${card.year} (>1890) [${rel}]`);
      }
    }
  }
}

console.log(`Citation check: ${missingLocus} missing locus, ${anachronistic} anachronistic schaff`);
if (details.length) {
  // Show first 30 to avoid flood
  for (const d of details.slice(0, 30)) console.log('  ' + d);
  if (details.length > 30) console.log(`  ... and ${details.length - 30} more`);
}

const strict = process.argv.includes('--strict');
if (strict && (missingLocus > 0 || anachronistic > 0)) {
  console.error(`\nFailing strict check: ${missingLocus + anachronistic} violations`);
  process.exit(1);
} else if (missingLocus > 0 || anachronistic > 0) {
  console.log(`\n(soft) ${missingLocus + anachronistic} violations — run with --strict to fail CI. Backfill loci per RESOURCE_EXPANSION.md:D2`);
}
