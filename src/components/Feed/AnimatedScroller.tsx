import type { Ref } from 'react';
import type { ScrollView, ScrollViewProps } from 'react-native';
import Animated, { type AnimatedRef } from 'react-native-reanimated';

/** What FlashList hands a `renderScrollComponent` function: its props, plus its own ref. */
type ScrollerProps = ScrollViewProps & { ref?: Ref<ScrollView> };

/**
 * Gives Reanimated a handle on the feed's scroll view.
 *
 * FlashList owns the `onScroll` prop outright — it wires its own handler and
 * calls yours afterwards as a plain JS callback — so a `useAnimatedScrollHandler`
 * passed in that way would never attach, silently. `useScrollOffset` takes a
 * different route: it registers a worklet handler against the scroll view's
 * native tag, which needs nothing from the props and coexists with FlashList's
 * own handler. All that is missing is a ref to the underlying view, and
 * `renderScrollComponent` is the only place FlashList offers one.
 *
 * The returned component's identity must be stable — `useSecondaryProps`
 * memoises on it, so a fresh function each render would remount the scroll view
 * every time — hence the factory, to be held in a `useMemo`.
 */
export function makeAnimatedScroller(animatedRef: AnimatedRef<ScrollView>) {
  return function AnimatedScroller({ ref, ...props }: ScrollerProps) {
    return (
      <Animated.ScrollView
        {...props}
        ref={(node: ScrollView | null) => {
          // Both refs want the same node: FlashList drives the list with its
          // one, Reanimated reads the scroll offset through the other.
          animatedRef(node as never);
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
      />
    );
  };
}
