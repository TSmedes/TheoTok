/**
 * Web-only. Animates a scroll container by assigning `scrollTop` each frame,
 * rather than relying on `scrollTo({ behavior: 'smooth' })`.
 *
 * Two reasons to own the animation. It is cancellable: if the user flicks the
 * scroller while a keyboard-initiated scroll is still running, we hand control
 * back immediately instead of fighting their gesture for `scrollTop`, which is
 * what native smooth scroll does. And the duration is fixed, so the feed feels
 * the same in every browser rather than inheriting each engine's own curve.
 *
 * Snapping is suspended for the duration: a `scroll-snap-type: mandatory`
 * container re-snaps against per-frame scroll writes. It is restored on
 * landing, and the target is always itself a snap point, so the hand-off is
 * clean.
 */

import { motion } from '@/theme/tokens';

export interface ScrollTween {
  cancel(): void;
}

/**
 * Deliberately not `motionEase.out`. That curve is a cubic-bezier, which needs a
 * numeric solver to evaluate in JS, and this is the one place in the app that
 * drives an animation from JS rather than CSS or the UI thread. Cubic ease-out
 * is close enough in character — a long decelerating tail — that the difference
 * is invisible on a 320ms page scroll, and it costs no solver.
 */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  // The reader's own choice as well as the OS setting. `data-motion` is written
  // by `useMotionPreference`, which is the one place the two are combined; this
  // reads the attribute rather than the store because it is a plain function,
  // called from an event handler rather than from a component.
  if (document.documentElement.dataset.motion === 'reduced') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function animateScrollTo(el: HTMLElement, to: number): ScrollTween {
  const from = el.scrollTop;
  const delta = to - from;

  // Jump instantly when there is no point animating, or no way to. A hidden
  // tab is served no animation frames at all, so a tween there would suspend
  // snapping and then never land, leaving the feed subtly broken when the user
  // comes back to it.
  if (delta === 0 || prefersReducedMotion() || document.hidden) {
    el.scrollTop = to;
    return { cancel() {} };
  }

  const previousSnap = el.style.scrollSnapType;
  el.style.scrollSnapType = 'none';

  let frame: number | null = null;
  let done = false;
  // Declared up front so `finish` can detach it; assigned below, once `finish` exists.
  let onVisibilityChange: () => void = () => {};

  const finish = (landAt: number | null) => {
    if (done) return;
    done = true;
    if (frame !== null) cancelAnimationFrame(frame);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    if (landAt !== null) el.scrollTop = landAt;
    el.style.scrollSnapType = previousSnap;
  };

  // If the page is backgrounded mid-flight the frames stop, so land at once.
  onVisibilityChange = () => {
    if (document.hidden) finish(to);
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  const start = performance.now();
  const step = (now: number) => {
    if (done) return;
    const t = Math.min(1, (now - start) / motion.scroll);
    el.scrollTop = from + delta * easeOutCubic(t);
    if (t < 1) {
      frame = requestAnimationFrame(step);
    } else {
      finish(to);
    }
  };
  frame = requestAnimationFrame(step);

  // On cancel, leave the scroller wherever it got to and let snapping settle it.
  return { cancel: () => finish(null) };
}
