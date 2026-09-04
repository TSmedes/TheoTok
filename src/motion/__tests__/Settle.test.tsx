import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { Settle } from '../Settle';
import { SettleContext, useSettleState } from '../SettleContext';

function Probe() {
  const state = useSettleState();
  return <Text>{state === null ? 'static' : `animated:${state.active}:${state.motion}`}</Text>;
}

describe('SettleContext', () => {
  // This is the share-capture guarantee, not a style preference. `ShareCard`
  // renders a `Card` outside the feed to be photographed by
  // `react-native-view-shot`, which captures the view hierarchy as it stands —
  // an animation that has started but not committed is caught mid-flight. With
  // no provider, every `Settle` in that subtree must be an inert `View`.
  it('defaults to static, so a card rendered outside the feed never animates', async () => {
    await render(<Probe />);
    expect(screen.getByText('static')).toBeTruthy();
  });

  it('can be forced back to static inside a provider', async () => {
    await render(
      <SettleContext.Provider value={{ active: true, motion: 'full' }}>
        <SettleContext.Provider value={null}>
          <Probe />
        </SettleContext.Provider>
      </SettleContext.Provider>,
    );
    expect(screen.getByText('static')).toBeTruthy();
  });

  it('carries the active flag and the motion preference to the elements', async () => {
    await render(
      <SettleContext.Provider value={{ active: true, motion: 'reduced' }}>
        <Probe />
      </SettleContext.Provider>,
    );
    expect(screen.getByText('animated:true:reduced')).toBeTruthy();
  });
});

describe('Settle', () => {
  it('renders its children with no provider above it', async () => {
    await render(
      <Settle order={0}>
        <Text>In the beginning</Text>
      </Settle>,
    );
    expect(screen.getByText('In the beginning')).toBeTruthy();
  });

  it('renders its children on an active card', async () => {
    await render(
      <SettleContext.Provider value={{ active: true, motion: 'full' }}>
        <Settle order={1}>
          <Text>In the beginning</Text>
        </Settle>
      </SettleContext.Provider>,
    );
    expect(screen.getByText('In the beginning')).toBeTruthy();
  });

  it('keeps its children mounted on a card that is not active', async () => {
    // They are transparent, not absent: the text has to be there to be read by
    // a screen reader, and to be laid out before it settles in.
    await render(
      <SettleContext.Provider value={{ active: false, motion: 'full' }}>
        <Settle order={1}>
          <Text>In the beginning</Text>
        </Settle>
      </SettleContext.Provider>,
    );
    expect(screen.getByText('In the beginning')).toBeTruthy();
  });

  it('renders the rule variant, which has no children of its own', async () => {
    await render(
      <SettleContext.Provider value={{ active: true, motion: 'full' }}>
        <Settle order={3} variant="rule" style={{ width: 44, height: 1 }} />
      </SettleContext.Provider>,
    );
    expect(screen.toJSON()).toBeTruthy();
  });
});
