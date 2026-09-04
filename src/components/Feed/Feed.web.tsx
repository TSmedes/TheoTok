import { useCallback, useEffect, useRef, useState } from 'react';

import { animateScrollTo, type ScrollTween } from './scrollTween';
import type { FeedProps } from './types';
import { mountedCount, spacerAfter, spacerBefore, windowFor } from './windowing';

/**
 * Web feed. React Native Web maps `pagingEnabled` onto CSS scroll-snap but
 * hardcodes `scroll-snap-align: start` and gives no control over the container,
 * so this drops to the DOM and drives scroll-snap itself. That also buys wheel
 * and keyboard navigation, which native gets free from gestures.
 *
 * Height is `100dvh` rather than `100vh` so mobile browser chrome can't crop a
 * card; the tab bar floats over the feed rather than shrinking it, which keeps
 * one page exactly one viewport tall.
 */

/**
 * Pages kept mounted either side of the current one.
 *
 * Rendering the whole sequence is not viable: the library is ~900 cards, and
 * mounting every one produced 2.5 MB of DOM for a screen that shows exactly
 * one card. FlashList virtualises the native side; this is the web equivalent.
 * Three is enough to cover a fast flick before the scroll handler catches up.
 */
const OVERSCAN = 3;

export function Feed<T>({
  data,
  keyExtractor,
  renderItem,
  onIndexChange,
  initialIndex = 0,
}: FeedProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const [pageHeight, setPageHeight] = useState(0);
  // Captured once: later scrolling must not re-anchor the feed.
  const startIndex = useRef(Math.max(0, Math.min(initialIndex, data.length - 1))).current;
  const [activeIndex, setActiveIndex] = useState(startIndex);
  const [range, setRange] = useState(() => windowFor(startIndex, data.length, OVERSCAN));
  const restoredRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const tweenRef = useRef<ScrollTween | null>(null);

  // Track the page height so cards can size themselves the way native does,
  // and so the spacers can stand in for what is not mounted.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      setPageHeight(el.clientHeight);
      // The starting offset can only be applied once a page height is known,
      // which is not true on the first paint or during server rendering.
      if (!restoredRef.current && el.clientHeight > 0) {
        restoredRef.current = true;
        if (startIndex > 0) el.scrollTop = startIndex * el.clientHeight;
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [startIndex]);

  // A new sequence (filters changed) starts from the top. Skipped on the first
  // run so a restored position is not immediately thrown away.
  const seenData = useRef(data);
  useEffect(() => {
    if (seenData.current === data) return;
    seenData.current = data;
    setActiveIndex(0);
    setRange(windowFor(0, data.length, OVERSCAN));
    if (ref.current) ref.current.scrollTop = 0;
  }, [data]);

  const syncFromScroll = useCallback(() => {
    const el = ref.current;
    if (!el || el.clientHeight === 0) return;
    const index = Math.round(el.scrollTop / el.clientHeight);

    setActiveIndex((prev) => {
      if (prev === index) return prev;
      onIndexChange?.(index);
      return index;
    });

    // Derived from scroll position rather than from activeIndex, so a fast
    // flick widens the window even before the active card settles.
    const next = windowFor(index, data.length, OVERSCAN);
    setRange((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
  }, [data.length, onIndexChange]);

  const onScroll = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      syncFromScroll();
    });
  }, [syncFromScroll]);

  const scrollToIndex = useCallback(
    (index: number) => {
      const el = ref.current;
      if (!el || el.clientHeight === 0) return;
      const clamped = Math.max(0, Math.min(index, data.length - 1));
      tweenRef.current?.cancel();
      tweenRef.current = animateScrollTo(el, clamped * el.clientHeight);
    },
    [data.length],
  );

  // A tween in flight must yield the moment the user touches the scroller,
  // otherwise their gesture and our animation fight over scrollTop.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const yieldToUser = () => tweenRef.current?.cancel();
    el.addEventListener('wheel', yieldToUser, { passive: true });
    el.addEventListener('touchstart', yieldToUser, { passive: true });
    return () => {
      el.removeEventListener('wheel', yieldToUser);
      el.removeEventListener('touchstart', yieldToUser);
    };
  }, []);

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      tweenRef.current?.cancel();
    },
    [],
  );

  // Arrow / page / space navigation, ignored while the user is typing.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.tagName && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (target?.isContentEditable) return;

      const el = ref.current;
      if (!el || el.clientHeight === 0) return;
      const current = Math.round(el.scrollTop / el.clientHeight);

      switch (e.key) {
        case 'ArrowDown':
        case 'PageDown':
        case ' ':
          e.preventDefault();
          scrollToIndex(current + 1);
          break;
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          scrollToIndex(current - 1);
          break;
        case 'Home':
          e.preventDefault();
          scrollToIndex(0);
          break;
        case 'End':
          e.preventDefault();
          scrollToIndex(data.length - 1);
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [data.length, scrollToIndex]);

  const before = spacerBefore(range, pageHeight);
  const after = spacerAfter(range, data.length, pageHeight);
  const visible = data.slice(range.start, range.start + mountedCount(range));

  return (
    <div ref={ref} className="feed-scroller" onScroll={onScroll} tabIndex={-1}>
      {/*
        Spacers stand in for the pages that are not mounted. Their heights are
        exact, so scrollHeight and every snap point stay where they would be if
        the whole sequence were rendered — the window can shift under the
        reader without moving the scroll position.
      */}
      {before > 0 ? <div style={{ height: before, flexShrink: 0 }} aria-hidden /> : null}

      {visible.map((item, i) => {
        const index = range.start + i;
        const active = index === activeIndex;
        return (
          <div
            key={keyExtractor(item, index)}
            // The card's own elements animate off this class. There is no
            // Reanimated on web, so the entrance is a CSS keyframe and this is
            // what starts it — see `Settle.web.tsx` and `global.css`.
            className={active ? 'feed-page is-active' : 'feed-page'}>
            {renderItem({ item, index, height: pageHeight, isActive: active })}
          </div>
        );
      })}

      {after > 0 ? <div style={{ height: after, flexShrink: 0 }} aria-hidden /> : null}
    </div>
  );
}
