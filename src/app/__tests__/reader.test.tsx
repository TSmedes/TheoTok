/**
 * Reading a card in context.
 *
 * The scroll itself needs a real layout pass and so belongs to a device, but
 * everything that decides *what* the reader sees can be checked here: that a
 * confession card arrives among its neighbours rather than alone, that the text
 * shown is the document's and not the card's excerpt, and that the chapter view
 * names the book once rather than three times.
 */

import { render, screen } from '@testing-library/react-native';

import ReaderScreen from '../reader';
import { CARDS } from '@/content/library';

const params: { cardId?: string } = {};

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => params,
  useRouter: () => ({ back: jest.fn() }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

function open(cardId: string) {
  params.cardId = cardId;
  return render(<ReaderScreen />);
}

describe('reading a confession in context', () => {
  // Q37 sits well inside the catechism, so it has neighbours on both sides.
  const card = CARDS.find((c) => c.id === 'doc-wsc-37')!;
  const document = require('@/content/confessions/wsc.json') as {
    entries: { locus: string; prompt: string; body: string }[];
  };

  it('shows the questions either side of the one cited', async () => {
    await open(card.id);

    for (const locus of ['35', '36', '37', '38', '39']) {
      const entry = document.entries.find((e) => e.locus === locus)!;
      expect(await screen.findByText(entry.prompt)).toBeTruthy();
    }
  });

  it('does not open with the whole catechism', async () => {
    await open(card.id);

    // Q1 is a hundred questions away; it appears only once the reader asks.
    expect(screen.queryByText(document.entries[0].prompt)).toBeNull();
    expect(await screen.findByText('Earlier in this work')).toBeTruthy();
    expect(await screen.findByText('Later in this work')).toBeTruthy();
  });

  it('offers no way back past the beginning', async () => {
    await open('doc-wsc-1');

    expect(await screen.findByText('Later in this work')).toBeTruthy();
    expect(screen.queryByText('Earlier in this work')).toBeNull();
  });

  it('names the work and the article', async () => {
    await open(card.id);

    // Twice over: as the heading above the text, and again in the SOURCE block.
    expect(await screen.findAllByText('Westminster Shorter Catechism')).toHaveLength(2);
    expect(await screen.findByText('Q. 37')).toBeTruthy();
  });
});

describe('the text shown is the document, not the feed’s excerpt', () => {
  it('shows a neighbour that was too long to be a card, at full length', async () => {
    const document = require('@/content/confessions/heidelberg.json') as {
      entries: { locus: string; body: string }[];
    };

    // Q92 is the Ten Commandments in full — 1,798 characters, far past the 400
    // a card allows, so the feed drops it entirely. Opening a card beside it
    // should still show it whole; that is what the document files are for.
    const long = document.entries.find((e) => e.locus === '92')!;
    expect(long.body.length).toBeGreaterThan(400);
    expect(CARDS.some((c) => c.type === 'doctrine' && c.id === 'doc-heid-92')).toBe(false);

    const neighbour = CARDS.find((c) => c.id === 'doc-heid-93')!;
    await open(neighbour.id);

    expect(await screen.findByText(long.body)).toBeTruthy();
  });
});

describe('reading a passage in context', () => {
  it('names the book once, leaving the third line to the translation', async () => {
    // Psalm 46:10 — the citation and the chapter heading have both said "Psalm"
    // by the time the translation line is reached.
    const card = CARDS.find((c) => c.type === 'scripture' && c.ref.book === 'PSA')!;
    await open(card.id);

    const translation = await screen.findByText('New Revised Standard Version');
    expect(translation).toBeTruthy();
    expect(screen.queryByText(/·\s*New Revised Standard Version/)).toBeNull();
  });
});

describe('a card with no document behind it', () => {
  it('shows the card itself rather than an empty context', async () => {
    // History cards are our own prose over a secondary source: nothing surrounds
    // them, and the reader should get the card and its source, not a spinner.
    const card = CARDS.find((c) => c.type === 'history')!;
    await open(card.id);

    expect(await screen.findByText(card.body)).toBeTruthy();
    expect(screen.queryByText('Earlier in this work')).toBeNull();
  });
});
