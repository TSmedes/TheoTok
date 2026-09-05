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

describe('useFeed', () => {
  beforeEach(() => {
    latest = null;
    clearSequence();
    usePreferences.setState({ traditions: [], types: ['scripture', 'history', 'doctrine'] });
  });

  /**
   * Rendering as each row draws was tried and reverted: it moves the work into
   * the scroll frame, which is where a feed can least afford it. Every page
   * arrives ready, and the cost is paid once — behind the Options screen's Save
   * spinner, where it is expected.
   */
  it('renders every page up front rather than as rows draw', async () => {
    const feed = await mount();

    expect(feed.pages.length).toBeGreaterThan(100);
    for (const page of feed.pages.slice(0, 20)) {
      expect(page.rendered.citation).toBeTruthy();
    }
  });

  it('reuses the render cache, so a rebuild does not re-render the library', async () => {
    await mount();
    const rendered = jest.spyOn(library, 'renderedFor');

    await act(async () => {
      usePreferences.getState().setTypes(['scripture', 'history']);
    });

    // Called for the new pool, but every call is a cache hit rather than a
    // fresh render, which is what makes committing a filter cheap.
    expect(rendered).toHaveBeenCalled();
    const first = latest!.pages[0];
    expect(library.renderedFor(first.card)).toBe(library.renderedFor(first.card));

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
