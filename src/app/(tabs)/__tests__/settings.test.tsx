import { act, render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { usePreferences } from '@/store/preferences';

import SettingsScreen from '../settings';

/** The screen reads safe-area insets, which need a provider and a measured frame. */
function Screen() {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}>
      <SettingsScreen />
    </SafeAreaProvider>
  );
}

/** Rendering is async in this setup, so a press has to be flushed the same way. */
async function press(label: string) {
  await act(async () => {
    fireEvent.press(screen.getByLabelText(label));
  });
}

/**
 * The contract this screen now keeps: choosing is free and changes nothing, and
 * Save is the single moment the feed is rebuilt. Applying each tap as it landed
 * is what made the control feel dead, so "a tap does not reach the store" is the
 * behaviour worth pinning.
 */
describe('Options filters', () => {
  beforeEach(() => {
    usePreferences.setState({
      traditions: [],
      types: ['scripture', 'history', 'doctrine'],
    });
  });

  async function openContent() {
    await render(<Screen />);
    await press('Content');
  }

  it('keeps a selection as a draft, without touching the store', async () => {
    await openContent();

    await press('Doctrine');

    expect(usePreferences.getState().types).toEqual(['scripture', 'history', 'doctrine']);
    expect(screen.getByLabelText('Save filters')).toBeTruthy();
  });

  it('offers no Save until the draft differs from what is committed', async () => {
    await render(<Screen />);

    expect(screen.queryByLabelText('Save filters')).toBeNull();
  });

  it('commits the draft when Save is pressed', async () => {
    await openContent();

    await press('Doctrine');
    await press('Save filters');

    // Save yields a frame so the spinner can paint before it does the work, so
    // the commit lands a tick after the press rather than inside it.
    await waitFor(() => {
      expect(usePreferences.getState().types).toEqual(['scripture', 'history']);
    });
  });

  it('refuses to save an empty content selection', async () => {
    await openContent();

    await press('Scripture');
    await press('Church History');
    await press('Doctrine');

    // The button is there, because the draft is dirty, but it will not commit a
    // selection that would leave the feed with nothing in it.
    const save = screen.getByLabelText('Save filters');
    expect(save.props.accessibilityState.disabled).toBe(true);

    await press('Save filters');

    expect(usePreferences.getState().types).toEqual(['scripture', 'history', 'doctrine']);
  });

  it('commits traditions too, as one change', async () => {
    await render(<Screen />);
    await press('Traditions');

    await press('Reformed');
    await press('Save filters');

    await waitFor(() => {
      expect(usePreferences.getState().traditions).toEqual(['reformed']);
    });
  });
});
