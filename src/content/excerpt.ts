/**
 * What makes an excerpt readable on its own.
 *
 * A card is almost never a whole document. Scripture cards cut at verse
 * numbers, which the NRSV does not treat as sentence boundaries, and confession
 * articles are split at semicolons when a single sentence runs past
 * BODY_MAX_CHARS. Both leave the reader holding half a thought with a stray
 * quotation mark on one end.
 *
 * This module is the one place that knows how to repair that: balance the
 * delimiters, and say plainly with an ellipsis that the excerpt was cut. It is
 * pure and does no I/O, so the build scripts, the audit and the tests all agree
 * on what a coherent card looks like.
 *
 * It is deliberately never applied to the full texts in `src/content/bible/` or
 * `src/content/confessions/`. Those are what the reader opens when a card is
 * not enough, and they must stay exactly as they were written.
 */

export const ELLIPSIS = '…';

/**
 * Characters `cleanExcerpt` may add: a leading "… ", a trailing " …" and a pair
 * of completed quotation marks. Chunkers reserve this so a body that fits
 * BODY_MAX_CHARS before cleaning still fits after it.
 */
export const ELISION_BUDGET = 6;

/** Openers we balance, and what closes them. */
const PAIRS: Record<string, string> = { '(': ')', '[': ']', '{': '}', '“': '”', '‘': '’' };
const CLOSERS: Record<string, string> = { ')': '(', ']': '[', '}': '{', '”': '“' };
const QUOTES = new Set(['"', '“', '”', '‘', '’']);
const PARTNER: Record<string, string> = { '"': '"', '“': '”', '”': '“', '‘': '’', '’': '‘' };

/*
 * The straight `'` is left alone entirely: in this corpus it is always an
 * apostrophe ("God's"), never a quotation mark. Its curly cousin `’` is both,
 * and `singleQuoteIsClosing` decides which.
 */

/** A truncated parenthetical this long or shorter is dropped whole. */
const STRAY_SPAN_MAX = 40;

export interface ExcerptFlags {
  /** Opens partway through a sentence — a lowercase word, or leading punctuation. */
  startsMidSentence: boolean;
  /** Runs out before its sentence ends. */
  endsMidSentence: boolean;
  /** Indices of openers whose closer was cut away. */
  orphanOpeners: number[];
  /** Indices of closers whose opener was cut away. */
  orphanClosers: number[];
  /** Already carries an elision mark, so cleaning it again would double up. */
  hasElision: boolean;
}

/**
 * A straight `"` is the same character opening and closing, so it is read from
 * its neighbours: a quote hard against the word before it and followed by space
 * or punctuation is closing one.
 */
function looksLikeCloser(text: string, i: number): boolean {
  const before = text[i - 1];
  const after = text[i + 1];
  if (before == null || /\s|[([{“]/.test(before)) return false;
  return after == null || /[\s.,;:!?)\]}]/.test(after);
}

/**
 * Whether a curly `’` closes a quotation or is simply an apostrophe.
 *
 * The NRSV nests reported speech in single quotes — Matthew 25 has the king
 * quoting himself — so an excerpt can end on a closing `’` whose opener is in
 * the verse before. But `’` is also the possessive in "the Jews’ law", and
 * treating that as a quotation would hang an opening mark on the front of the
 * card. It counts as a quotation mark only where one is actually in play: a
 * `‘` is open, or the excerpt ends on it.
 */
function singleQuoteIsClosing(text: string, i: number, singleOpen: boolean): boolean {
  const before = text[i - 1];
  const after = text[i + 1];
  if (/[A-Za-z]/.test(before ?? '') && /[A-Za-z]/.test(after ?? '')) return false;
  return singleOpen || i === text.length - 1;
}

function scan(text: string): { orphanOpeners: number[]; orphanClosers: number[] } {
  const stack: { char: string; index: number }[] = [];
  const orphanClosers: number[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      const top = stack[stack.length - 1];
      if (top?.char === '"') stack.pop();
      else if (looksLikeCloser(text, i)) orphanClosers.push(i);
      else stack.push({ char, index: i });
      continue;
    }

    if (char === '’') {
      const top = stack[stack.length - 1];
      if (!singleQuoteIsClosing(text, i, top?.char === '‘')) continue;
      if (top?.char === '‘') stack.pop();
      else orphanClosers.push(i);
      continue;
    }

    if (PAIRS[char]) {
      stack.push({ char, index: i });
      continue;
    }

    if (CLOSERS[char]) {
      const top = stack[stack.length - 1];
      if (top && top.char === CLOSERS[char]) stack.pop();
      else orphanClosers.push(i);
    }
  }

  return { orphanOpeners: stack.map((s) => s.index), orphanClosers };
}

/** Terminal punctuation, ignoring any closing delimiters piled after it. */
function endsSentence(text: string): boolean {
  const trimmed = text.replace(/["'”’)\]}\s]+$/, '');
  return /[.!?…]$/.test(trimmed);
}

function startsSentence(text: string): boolean {
  const trimmed = text.replace(/^["'“‘([{…\s]+/, '');
  return trimmed === '' || !/^[a-z]/.test(trimmed);
}

/** An excerpt already marked at that end — the mark may sit inside a quote. */
const LEADING_MARK = /^["“'‘]?\s*…/;
const TRAILING_MARK = /…\s*["”'’]?$/;

/** Whether an excerpt already says it was cut. */
export function hasLeadingMark(text: string): boolean {
  return LEADING_MARK.test(text.trim());
}
export function hasTrailingMark(text: string): boolean {
  return TRAILING_MARK.test(text.trim());
}

/**
 * Punctuation a cut leaves stranded at the head of an excerpt. Includes the
 * full stop, because dropping a truncated proof-text reference such as
 * "4:8, quoting Ps. 68:18)." leaves one behind.
 */
const STRANDED_HEAD = /^[.,;:!?—–-]+\s*/;
const STRANDED_TAIL = /[\s,;:—–-]+$/;

export function analyse(text: string): ExcerptFlags {
  const trimmed = text.trim();
  const { orphanOpeners, orphanClosers } = scan(trimmed);
  return {
    startsMidSentence: !startsSentence(trimmed) || /^[,;:]/.test(trimmed),
    endsMidSentence: !endsSentence(trimmed),
    orphanOpeners,
    orphanClosers,
    hasElision: LEADING_MARK.test(trimmed) || TRAILING_MARK.test(trimmed),
  };
}

/**
 * The text an excerpt actually says, with its repairs taken back off. A card
 * reading `"… this is my body," etc. …` clears BODY_MIN on length alone while
 * saying almost nothing; measuring it stripped is what catches that.
 */
export function substance(text: string): string {
  return text
    .replace(/…/g, '')
    .replace(/["“”‘’()[\]{}]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export interface CleanOptions {
  /**
   * Force the marks on. Chunkers know from the excerpt's position whether text
   * was cut away; punctuation alone cannot tell an excerpt that happens to end
   * on a full stop from one that ends the article.
   */
  elideStart?: boolean;
  elideEnd?: boolean;
}

/**
 * Repairs one excerpt: balances its delimiters, drops a dangling connector, and
 * marks either end that was cut with an ellipsis.
 *
 * Quotation marks are completed rather than deleted — an excerpt of reported
 * speech reads correctly with its own quotes, and deleting them would silently
 * turn a quotation into the narrator's own words. Parentheses are the opposite:
 * a half-eaten "2:18)" is a proof-text reference the reader cannot use, so it
 * goes.
 */
export function cleanExcerpt(text: string, opts: CleanOptions = {}): string {
  let out = text.trim();
  if (!out) return out;

  // Brackets first: dropping a stray parenthetical can change where the
  // sentence appears to begin and end.
  out = dropStrayBrackets(out);
  if (!out) return out;

  // Punctuation the cut left stranded, removed before the excerpt is judged:
  // ", and afterwards" reads as a typo, "… and afterwards" reads as an excerpt.
  out = out.replace(STRANDED_HEAD, '').trim();
  if (!out) return out;

  const flags = analyse(out);
  const elideStart = (opts.elideStart ?? false) || flags.startsMidSentence;
  const elideEnd = (opts.elideEnd ?? false) || flags.endsMidSentence;

  if (elideEnd) out = out.replace(STRANDED_TAIL, '').trim();
  if (!out) return out;

  // The partner is drawn from the orphan's own character, so a document that
  // punctuates with straight quotes is not handed a curly one in reply.
  const { orphanOpeners, orphanClosers } = scan(out);
  const orphanClose = orphanClosers.find((i) => QUOTES.has(out[i]));
  const orphanOpen = orphanOpeners.find((i) => QUOTES.has(out[i]));
  const openQuote = orphanClose == null ? '' : PARTNER[out[orphanClose]];
  const closeQuote = orphanOpen == null ? '' : PARTNER[out[orphanOpen]];

  if (elideEnd && !TRAILING_MARK.test(out)) out = `${out} ${ELLIPSIS}`;
  out = `${openQuote}${out}${closeQuote}`;
  if (elideStart && !LEADING_MARK.test(out)) {
    out = `${openQuote}${ELLIPSIS} ${out.slice(openQuote.length)}`;
  }

  return dropUnbalancedQuotes(tightenQuotes(out.replace(/\s{2,}/g, ' ').trim()));
}

/** Closes the gap the upstream texts leave just inside a quotation mark. */
function tightenQuotes(text: string): string {
  return text
    .replace(/(^|[\s([{])(["“‘])\s+/g, '$1$2')
    .replace(/\s+(["”’])($|[\s.,;:!?)\]}])/g, '$1$2');
}

/**
 * The last resort for quotation marks. A handful of upstream articles quote
 * Scripture with a typo where a closing quote should be — Second Helvetic 5.2
 * ends one quotation with a colon — and no amount of adding partners will
 * balance them. Completing a quote is preferred wherever it works; where it
 * cannot, the stray mark is deleted rather than left on the card.
 */
function dropUnbalancedQuotes(text: string): string {
  const { orphanOpeners, orphanClosers } = scan(text);
  const strays = new Set([...orphanOpeners, ...orphanClosers].filter((i) => QUOTES.has(text[i])));
  if (strays.size === 0) return text;

  let out = '';
  for (let i = 0; i < text.length; i++) if (!strays.has(i)) out += text[i];
  return out.replace(/\s{2,}/g, ' ').trim();
}

/**
 * A parenthetical cut in half — "2:18) And further" at the head, or
 * "(Heb. 7:24" at the tail — is dropped along with the fragment it wraps, when
 * that fragment is short enough to be one. A stray bracket in the middle of a
 * long passage is simply removed; taking the surrounding text with it would
 * cost more than it saves.
 */
function dropStrayBrackets(text: string): string {
  const { orphanOpeners, orphanClosers } = scan(text);
  const strays = [...orphanOpeners, ...orphanClosers].filter((i) => !QUOTES.has(text[i]));
  if (strays.length === 0) return text;

  const drop = new Set(strays);
  let head = 0;
  let tail = text.length;

  for (const i of strays) {
    if (CLOSERS[text[i]] && i < STRAY_SPAN_MAX) head = Math.max(head, i + 1);
    if (PAIRS[text[i]] && text.length - i < STRAY_SPAN_MAX) tail = Math.min(tail, i);
  }

  let out = '';
  for (let i = head; i < tail; i++) if (!drop.has(i)) out += text[i];
  return out.replace(/\s{2,}/g, ' ').trim();
}
