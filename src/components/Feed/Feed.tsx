import { FlashList } from '@shopify/flash-list';
import { useCallback, useRef, useState } from 'react';
import { View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import type { FeedProps } from './types';

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
  initialIndex = 0,
}: FeedProps<T>) {
  const [height, setHeight] = useState(0);
  // Captured once: later scrolling must not re-anchor the list.
  const startIndex = useRef(Math.max(0, Math.min(initialIndex, data.length - 1))).current;
  const [activeIndex, setActiveIndex] = useState(startIndex);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setHeight(e.nativeEvent.layout.height);
  }, []);

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (height <= 0) return;
      const next = Math.round(e.nativeEvent.contentOffset.y / height);
      setActiveIndex((prev) => {
        if (prev === next) return prev;
        onIndexChange?.(next);
        return next;
      });
    },
    [height, onIndexChange],
  );

  return (
    <View style={{ flex: 1 }} onLayout={onLayout}>
      {height > 0 && (
        <FlashList
          data={data as T[]}
          keyExtractor={keyExtractor}
          renderItem={({ item, index }) => (
            <View style={{ height }}>
              {renderItem({ item, index, height, isActive: index === activeIndex })}
            </View>
          )}
          initialScrollIndex={startIndex}
          pagingEnabled
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumScrollEnd}
        />
      )}
    </View>
  );
}
