import { act, render } from '@testing-library/react-native';
import { useEffect } from 'react';

import * as library from '@/content/library';
import { usePreferences } from '@/store/preferences';

import { clearSequence } from '../sequence';
import { useFeed, type Feed } from '../useFeed';

/**
 * `renderHook` from this version of the testing library returns an empty object
 * under the jest-expo preset, so the hook is driven through a probe component
 * instead — the same approach the rest of the suite takes to rendering. The
 * result is published from an effect rather than during render, so the probe
 * stays a pure component.
 */
let latest: Feed | null = null;

function Probe() {
  const feed = useFeed();
  useEffect(() => {
    latest = feed;
  }, [feed]);
  return null;
}

async function mount(): Promise<Feed> {
  await render(<Probe />);
  if (!latest) throw new Error('useFeed did not run');
  return latest;
}

/**
 * The feed orders the whole pool but the reader sees a handful of cards, so
 * rendering a card has to be something the list asks for as it draws a row —
 * not something the pool pays for up front. With ~4,000 cards in the library
 * that difference is the whole cost of changing a filter.
 */
describe('useFeed', () => {
  beforeEach(() => {
    latest = null;
    clearSequence();
    usePreferences.setState({ traditions: [], types: ['scripture', 'history', 'doctrine'] });
  });

  it('does not render any card just to build the pages', async () => {
    const rendered = jest.spyOn(library, 'renderedFor');

    const feed = await mount();

    expect(feed.pages.length).toBeGreaterThan(100);
    expect(rendered).not.toHaveBeenCalled();

    rendered.mockRestore();
  });

  it('renders a card when a row asks for it, and only that card', async () => {
    const feed = await mount();
    const rendered = jest.spyOn(library, 'renderedFor');

    const first = feed.pages[0];
    expect(first.rendered.citation).toBeTruthy();

    expect(rendered).toHaveBeenCalledTimes(1);
    expect(rendered).toHaveBeenCalledWith(first.card);

    rendered.mockRestore();
  });

  it('rebuilds the pool when the filters change', async () => {
    const feed = await mount();
    const everything = feed.poolSize;
    expect(everything).toBeGreaterThan(0);

    await act(async () => {
      usePreferences.getState().toggleType('doctrine');
    });

    expect(latest!.poolSize).toBeLessThan(everything);
    expect(latest!.pages.every((p) => p.card.type !== 'doctrine')).toBe(true);
  });
});
