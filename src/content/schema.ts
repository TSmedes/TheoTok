/**
 * Zod schemas for the card library. Imported by `scripts/validate-content.ts`
 * and by tests, never by the app: the data is validated at build time, so
 * paying for runtime validation (and bundling zod) would buy nothing.
 */

import { z } from 'zod';

import { BOOKS } from './books';
import { CONTENT_TYPES, TRADITIONS } from './types';

/** Cards longer than this fall off the bottom text tier and stop fitting a page. */
export const BODY_MAX_CHARS = 400;
/** A headline is a hook, not a paragraph. */
export const PROMPT_MAX_CHARS = 120;

const bookIds = BOOKS.map((b) => b.id) as [string, ...string[]];

export const refSchema = z
  .object({
    book: z.enum(bookIds),
    chapter: z.number().int().positive(),
    verseStart: z.number().int().positive(),
    verseEnd: z.number().int().positive().optional(),
  })
  .refine((r) => r.verseEnd == null || r.verseEnd >= r.verseStart, {
    message: 'verseEnd must not be before verseStart',
  });

export const sourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  shortTitle: z.string().min(1).optional(),
  year: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  tradition: z.enum(TRADITIONS as unknown as [string, ...string[]]),
  locusPrefix: z.string().min(1).optional(),
  url: z.string().url().optional(),
  redistributable: z.boolean(),
  licenseNote: z.string().min(1).optional(),
});

/** Lowercase, hyphenated, prefixed by kind: "scr-psa-46-10", "doc-wsc-1". */
const idSchema = z
  .string()
  .regex(/^(scr|doc|his)-[a-z0-9-]+$/, 'id must look like "scr-psa-46-10" / "doc-wsc-1" / "his-nicaea-scars"');

const cardBase = {
  id: idSchema,
  traditions: z.array(z.enum(TRADITIONS as unknown as [string, ...string[]])).min(1),
  themes: z.array(z.string().min(1)).min(1),
  weight: z.number().positive().optional(),
};

export const scriptureCardSchema = z.object({
  ...cardBase,
  type: z.literal('scripture'),
  ref: refSchema,
  display: z.string().min(1).max(BODY_MAX_CHARS).optional(),
});

export const doctrineCardSchema = z.object({
  ...cardBase,
  type: z.literal('doctrine'),
  sourceId: z.string().min(1),
  locus: z.string().min(1).optional(),
  prompt: z.string().min(1).max(PROMPT_MAX_CHARS).optional(),
  body: z.string().min(1).max(BODY_MAX_CHARS),
  proofTexts: z.array(refSchema).optional(),
});

export const historyCardSchema = z.object({
  ...cardBase,
  type: z.literal('history'),
  headline: z.string().min(1).max(PROMPT_MAX_CHARS),
  body: z.string().min(1).max(BODY_MAX_CHARS),
  year: z.number().int().optional(),
  yearDisplay: z.string().min(1).optional(),
  sourceId: z.string().min(1),
  locus: z.string().min(1).optional(),
});

export const cardSchema = z.discriminatedUnion('type', [
  scriptureCardSchema,
  doctrineCardSchema,
  historyCardSchema,
]);

export const cardsFileSchema = z.array(cardSchema);
export const sourcesFileSchema = z.array(sourceSchema);

/** Guards against the id prefix disagreeing with the card's own type. */
export const ID_PREFIX: Record<string, string> = {
  scripture: 'scr',
  history: 'his',
  doctrine: 'doc',
};

export const CONTENT_TYPE_VALUES = CONTENT_TYPES;
