/** One book of the bundled Bible (NRSV primary, KJV fallback), as written by scripts/build-bible-nrsv.ts. */
export interface BibleBook {
  id: string;
  name: string;
  /** chapter number -> verse number -> text, both keyed as strings by JSON. */
  chapters: Record<string, Record<string, string>>;
  /** Psalm superscriptions ("A Psalm of David"), by chapter. */
  subtitles?: Record<string, string>;
}
