/**
 * Virtualisation arithmetic for the web feed.
 *
 * Kept separate from the component because the property that matters here is
 * checkable without a browser: the mounted pages plus the two spacers must
 * always occupy exactly the height the full sequence would. If that holds,
 * `scrollHeight` never changes as the window slides, so every snap point stays
 * where it was and the scroll position cannot jump under the reader.
 */

export interface PageWindow {
  /** First mounted index, inclusive. */
  start: number;
  /** Last mounted index, inclusive. */
  end: number;
}

/** The range of pages to keep mounted around `index`. */
export function windowFor(index: number, total: number, overscan: number): PageWindow {
  if (total <= 0) return { start: 0, end: -1 };
  const clamped = Math.max(0, Math.min(index, total - 1));
  return {
    start: Math.max(0, clamped - overscan),
    end: Math.min(total - 1, clamped + overscan),
  };
}

/** Height standing in for the unmounted pages above the window. */
export function spacerBefore(range: PageWindow, pageHeight: number): number {
  return Math.max(0, range.start) * pageHeight;
}

/** Height standing in for the unmounted pages below the window. */
export function spacerAfter(range: PageWindow, total: number, pageHeight: number): number {
  return Math.max(0, total - 1 - range.end) * pageHeight;
}

/** How many pages the window actually mounts. */
export function mountedCount(range: PageWindow): number {
  return Math.max(0, range.end - range.start + 1);
}
