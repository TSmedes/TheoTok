import type { BookId } from './books';

export type ContentType = 'scripture' | 'history' | 'doctrine';

export const CONTENT_TYPES: readonly ContentType[] = ['scripture', 'history', 'doctrine'];

export type Tradition =
  | 'catholic'
  | 'orthodox'
  | 'reformed'
  | 'lutheran'
  | 'anglican'
  | 'baptist'
  | 'methodist'
  /** Shared inheritance — creeds, councils, Scripture. Matches every filter. */
  | 'ecumenical';

export const TRADITIONS: readonly Tradition[] = [
  'catholic',
  'orthodox',
  'reformed',
  'lutheran',
  'anglican',
  'baptist',
  'methodist',
  'ecumenical',
];

export const TRADITION_LABELS: Record<Tradition, string> = {
  catholic: 'Catholic',
  orthodox: 'Orthodox',
  reformed: 'Reformed',
  lutheran: 'Lutheran',
  anglican: 'Anglican',
  baptist: 'Baptist',
  methodist: 'Methodist',
  ecumenical: 'Ecumenical',
};

/** A scripture reference. `verseEnd` omitted means a single verse. */
export interface Ref {
  book: BookId;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
}

/**
 * A cited work. Cards hold a `sourceId` pointing here rather than a hand-typed
 * citation string, so that citations stay consistent across the whole library
 * and can never drift card to card.
 */
export interface Source {
  id: string;
  /** Full title as it should appear in a citation. */
  title: string;
  /** Shorter form for cramped contexts. */
  shortTitle?: string;
  /** Year of the work, for display: "1647", "c. 325". */
  year?: string;
  author?: string;
  tradition: Tradition;
  /** How a locus is labelled in this work: "Q." for catechisms, "Art." etc. */
  locusPrefix?: string;
  url?: string;
  /**
   * False for works still under copyright. Kept as data so a single build flag
   * can exclude them if this app is ever distributed.
   */
  redistributable: boolean;
  licenseNote?: string;
}

interface CardBase {
  /** Stable and human-readable ("scr-psa-46-10"). Saved cards reference it, so it must survive edits. */
  id: string;
  type: ContentType;
  /** A card matches a filter if any of its traditions is selected. */
  traditions: Tradition[];
  themes: string[];
  /** Curation nudge; higher surfaces more often. Default 1. */
  weight?: number;
}

export interface ScriptureCard extends CardBase {
  type: 'scripture';
  ref: Ref;
  /** Overrides the resolved verse text, for trimming or eliding. */
  display?: string;
}

export interface DoctrineCard extends CardBase {
  type: 'doctrine';
  sourceId: string;
  /**
   * Position within the source: "1", "431", "IV". Rendered with the source's
   * locusPrefix. Absent for works cited whole — the creeds have no locus.
   */
  locus?: string;
  /** The question, for catechisms in Q&A form. */
  prompt?: string;
  body: string;
  proofTexts?: Ref[];
}

export interface HistoryCard extends CardBase {
  type: 'history';
  /** The hook — displayed above the body in smaller type. */
  headline: string;
  body: string;
  /** Sorts and filters by period. */
  year?: number;
  /** Displayed form, where it differs: "c. 250", "1517". */
  yearDisplay?: string;
  sourceId: string;
  locus?: string;
}

export type Card = ScriptureCard | DoctrineCard | HistoryCard;

/**
 * What the UI actually renders. Producing this is the only place that knows how
 * the three card variants differ, so every component downstream is uniform.
 */
export interface RenderedCard {
  id: string;
  type: ContentType;
  /** Catechism question, or a history headline. */
  prompt?: string;
  body: string;
  /** "Psalm 46:10" / "Westminster Shorter Catechism, Q. 1" */
  citation: string;
  /** "King James Version" / "1647" — the quieter second line. */
  attribution?: string;
  /**
   * What the card leads with in question-and-answer mode, with the body and the
   * citation withheld until the reader asks for them. Present only where the
   * material is already a question: a catechism asks one, and a history card
   * opens with a hook. Scripture and the creeds have none, so they always
   * render in full whatever the setting.
   */
  cue?: string;
  /** Small label above the cue: "QUESTION", "WHAT HAPPENED?". */
  cueLabel?: string;
}
