import { CARDS } from '@/content/library';
import { clampIndex, resolveSaved } from '@/store/savedCards';

const realIds = CARDS.slice(0, 3).map((c) => c.id);

describe('resolveSaved', () => {
  it('keeps saved order rather than library order', () => {
    const reversed = [...realIds].reverse();
    expect(resolveSaved(reversed).map((i) => i.card.id)).toEqual(reversed);
  });

  it('skips ids whose card no longer exists', () => {
    const items = resolveSaved([realIds[0], 'deleted-card-id', realIds[1]]);
    expect(items.map((i) => i.card.id)).toEqual([realIds[0], realIds[1]]);
  });

  it('renders each card alongside it', () => {
    const [item] = resolveSaved([realIds[0]]);
    expect(item.rendered.id).toBe(realIds[0]);
    expect(item.rendered.citation).toBeTruthy();
  });

  it('returns nothing for an empty collection', () => {
    expect(resolveSaved([])).toEqual([]);
  });
});

describe('clampIndex', () => {
  it('keeps an in-range index', () => {
    expect(clampIndex(2, 5)).toBe(2);
  });

  it('pulls an index past the end back to the last card', () => {
    // Unsaving the card you were viewing shortens the list underneath you.
    expect(clampIndex(4, 3)).toBe(2);
  });

  it('floors a negative or unparsed index at zero', () => {
    expect(clampIndex(-1, 3)).toBe(0);
    expect(clampIndex(Number.NaN, 3)).toBe(0);
  });

  it('reports zero for an empty collection', () => {
    expect(clampIndex(3, 0)).toBe(0);
  });
});
