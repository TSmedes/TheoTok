import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { Citation } from '../Citation';

const LONG = 'The Longer Catechism of the Orthodox, Catholic, Eastern Church, Q. 123';

function paddingRight(): number {
  return StyleSheet.flatten(screen.getByTestId('citation-block').props.style)?.paddingRight ?? 0;
}

describe('Citation', () => {
  it('holds a long citation clear of the action rail', async () => {
    await render(<Citation type="doctrine" citation={LONG} railInset />);
    // The rail's buttons are 44 wide and sit 16 in from the card edge, so the
    // citation has to give up at least that much or it wraps underneath them.
    expect(paddingRight()).toBeGreaterThanOrEqual(44);
  });

  it('uses the full width when there is no rail, as in a shared image', async () => {
    await render(<Citation type="doctrine" citation={LONG} />);
    expect(paddingRight()).toBe(0);
  });

  it('lets a long citation wrap rather than truncating it', async () => {
    await render(<Citation type="doctrine" citation={LONG} railInset />);
    expect(screen.getByText(LONG).props.numberOfLines).toBeUndefined();
  });

  it('renders the attribution line only when there is one', async () => {
    await render(<Citation type="scripture" citation="Psalm 46:10" />);
    expect(screen.queryByText('King James Version')).toBeNull();

    await screen.rerender(
      <Citation type="scripture" citation="Psalm 46:10" attribution="King James Version" />,
    );
    expect(screen.queryByText('King James Version')).not.toBeNull();
  });
});
