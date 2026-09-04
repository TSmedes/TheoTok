import { FlashList } from '@shopify/flash-list';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
} from 'react-native';
import { useAnimatedRef, useScrollOffset } from 'react-native-reanimated';

import { scrollTick } from '@/motion/haptics';
import { detentAt } from '@/motion/scrollDetents';

import { makeAnimatedScroller } from './AnimatedScroller';
import type { FeedProps } from './types';
import { visualIndexFor } from './visualIndex';

/**
 * Native feed. The page height is *measured* rather than taken from
 * `Dimensions.get('window')`: safe-area insets and the tab bar can make the
 * scroller shorter than the screen, and `pagingEnabled` only lands cleanly when
 * the item height equals the scroller height exactly.
 */
export function Feed<T>({
  data,
  keyExtractor,
  renderItem,
  onIndexChange,
  renderBackdrop,
  initialIndex = 0,
}: FeedProps<T>) {
  const [height, setHeight] = useState(0);
  // Captured once: later scrolling must not re-anchor the list.
  const startIndex = useRef(Math.max(0, Math.min(initialIndex, data.length - 1))).current;
  /**
   * The card the reader settled on. Nothing renders from it — it exists only so
   * `onIndexChange` fires once per landing rather than once per momentum event.
   */
  const settledIndex = useRef(startIndex);
  /**
   * Which card the animations treat as current. Separate from `settledIndex`,
   * which answers "what did the reader land on" and only after the swipe
   * settles — too late to animate an entrance with. See `visualIndex.ts`.
   */
  const [visualIndex, setVisualIndex] = useState(startIndex);
  /**
   * The last notch the feed passed under the reader's thumb. `null` until the
   * first scroll frame, so mounting the list or restoring a saved position
   * doesn't fire a haptic for a movement nobody made.
   */
  const detent = useRef<number | null>(null);

  /**
   * The scroll offset, live on the UI thread, for motion that tracks the
   * gesture rather than following it. `visualIndex` above is the same
   * information at one-per-card resolution, and is what React renders from;
   * this is what the animations read, sixty times a second, without a render.
   */
  const scrollRef = useAnimatedRef<ScrollView>();
  const scrollY = useScrollOffset(scrollRef);
  // Identity has to be stable: FlashList memoises its scroll view on this prop.
  const renderScrollComponent = useMemo(() => makeAnimatedScroller(scrollRef), [scrollRef]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setHeight(e.nativeEvent.layout.height);
  }, []);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = e.nativeEvent.contentOffset.y;
      const next = visualIndexFor(offsetY, height);
      // Fires up to 60×/sec, so bail before touching state on all but the one
      // frame per swipe where the answer actually changes.
      setVisualIndex((prev) => (prev === next ? prev : next));

      // The same stream at a much finer resolution: ten notches per card rather
      // than one. Comparing for inequality rather than counting the gap is what
      // lets a fling thin out on its own — crossing three detents inside one
      // frame is still one tick, so the rate is bounded by the frame rate and
      // falls away naturally as the scroll decelerates.
      const notch = detentAt(offsetY, height);
      if (detent.current !== null && notch !== detent.current) scrollTick();
      detent.current = notch;
    },
    [height],
  );

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (height <= 0) return;
      const next = Math.round(e.nativeEvent.contentOffset.y / height);
      // The last scroll frame is not guaranteed to land exactly on the snap
      // point, so settle the visual index here too rather than trusting it to
      // have arrived on its own.
      setVisualIndex((prev) => (prev === next ? prev : next));
      if (settledIndex.current === next) return;
      settledIndex.current = next;
      onIndexChange?.(next);
    },
    [height, onIndexChange],
  );

  return (
    <View style={{ flex: 1 }} onLayout={onLayout}>
      {height > 0 && renderBackdrop?.({ scrollY, height })}
      {height > 0 && (
        <FlashList
          data={data as T[]}
          keyExtractor={keyExtractor}
          renderItem={({ item, index }) => (
            <View style={{ height }}>
              {renderItem({ item, index, height, isActive: index === visualIndex, scrollY })}
            </View>
          )}
          renderScrollComponent={renderScrollComponent}
          initialScrollIndex={startIndex}
          pagingEnabled
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          // FlashList sets no default, and without one the scroll event fires
          // roughly once per gesture rather than per frame.
          scrollEventThrottle={16}
          onMomentumScrollEnd={onMomentumScrollEnd}
        />
      )}
    </View>
  );
}
