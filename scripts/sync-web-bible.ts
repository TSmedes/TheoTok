/**
 * Mirrors the KJV book files into `public/` for the web build.
 *
 * The two platforms need the same bytes in two different shapes. Native pulls a
 * book out of the bundle with `require`, so the files must sit inside `src/`
 * where Metro can see them. Web fetches them on demand from a URL, so the same
 * files must also exist under `public/`, which Expo serves verbatim — that is
 * what keeps ~5 MB of Scripture out of the JS bundle and off the critical path
 * to first paint.
 *
 * `src/content/bible/kjv/` is the source of truth and the copy that is tracked
 * in git. `public/bible/kjv/` is generated from it and gitignored, so the two
 * cannot drift, the repo carries one copy rather than two, and native EAS
 * builds — which honour .gitignore when uploading — stop shipping 5 MB they
 * never read.
 *
 *   node scripts/sync-web-bible.ts
 */

import { copyFileSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = join(ROOT, 'src', 'content', 'bible', 'kjv');
const WEB_DIR = join(ROOT, 'public', 'bible', 'kjv');
const SRC_DIR_NRSV = join(ROOT, 'src', 'content', 'bible', 'nrsv');
const WEB_DIR_NRSV = join(ROOT, 'public', 'bible', 'nrsv');

function syncDir(src: string, web: string): number {
  let sources: string[];
  try {
    sources = readdirSync(src).filter((f) => f.endsWith('.json'));
  } catch {
    throw new Error(
      `No book files at ${src}. Run \`npm run build:bible\` first — it downloads and normalises the text.`,
    );
  }

  if (sources.length === 0) {
    throw new Error(`${src} contains no .json books. Run \`npm run build:bible\` first.`);
  }

  mkdirSync(web, { recursive: true });

  // Drop books that no longer exist upstream, so a removed book cannot linger
  // in the web copy and keep being served after it is gone from the source.
  const wanted = new Set(sources);
  for (const existing of readdirSync(web)) {
    if (!wanted.has(existing)) rmSync(join(web, existing), { recursive: true, force: true });
  }

  let copied = 0;
  for (const file of sources) {
    const from = join(src, file);
    const to = join(web, file);

    // Skip files that are already identical, so a repeated run is nearly free
    // and does not churn 80 files on every `npm run web`.
    try {
      const a = statSync(from);
      const b = statSync(to);
      if (a.size === b.size && b.mtimeMs >= a.mtimeMs) continue;
    } catch {
      // Missing destination: fall through and copy.
    }

    copyFileSync(from, to);
    copied += 1;
  }

  return copied;
}

export function syncWebBible(): number {
  let total = 0;
  try { total += syncDir(SRC_DIR, WEB_DIR); } catch (e) { console.warn((e as Error).message); }
  try { total += syncDir(SRC_DIR_NRSV, WEB_DIR_NRSV); } catch (e) { console.warn((e as Error).message); }
  return total;
}

// Only when run directly, not when build-bible.ts imports it. Compared as file
// URLs because a bare string compare fails on Windows drive-letter paths.
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const copied = syncWebBible();
  console.log(
    copied === 0
      ? 'public/bible/kjv and public/bible/nrsv are already up to date.'
      : `Synced ${copied} book(s) to public/bible/kjv and public/bible/nrsv/.`,
  );
}
