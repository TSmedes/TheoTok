import type { RenderedCard } from '@/content/types';

/** The text form of a card, used for text sharing and for clipboard fallbacks. */
export function cardAsText(card: RenderedCard): string {
  const quote = card.prompt ? `${card.prompt}\n\n${card.body}` : card.body;
  const attribution = card.attribution ? ` (${card.attribution})` : '';
  return `${quote}\n\n— ${card.citation}${attribution}`;
}
