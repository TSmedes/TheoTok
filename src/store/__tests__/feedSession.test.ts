import { useFeedSession } from '@/store/feedSession';

const reset = () => useFeedSession.setState({ index: 0, revealed: [] });

describe('feedSession reveal state', () => {
  beforeEach(reset);

  it('reveals a card once, without duplicating it', () => {
    const { reveal } = useFeedSession.getState();
    reveal('card-a');
    reveal('card-a');
    expect(useFeedSession.getState().revealed).toEqual(['card-a']);
  });

  it('hides a revealed card again, leaving others alone', () => {
    const { reveal, hide } = useFeedSession.getState();
    reveal('card-a');
    reveal('card-b');
    hide('card-a');
    expect(useFeedSession.getState().revealed).toEqual(['card-b']);
  });

  it('treats hiding an already hidden card as a no-op', () => {
    const before = useFeedSession.getState().revealed;
    useFeedSession.getState().hide('never-revealed');
    // Same array identity: subscribers must not rerender over nothing.
    expect(useFeedSession.getState().revealed).toBe(before);
  });

  it('clears revealed answers on restart', () => {
    useFeedSession.getState().reveal('card-a');
    useFeedSession.getState().restart();
    expect(useFeedSession.getState().revealed).toEqual([]);
  });
});
