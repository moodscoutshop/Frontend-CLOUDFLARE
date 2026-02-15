import { useRef, useEffect, useCallback } from 'react';

/**
 * useSwipeNavigation - Detects horizontal swipe gestures on a container
 * and navigates between tabs.
 *
 * Only navigates to tabs whose state is 'completed' or 'loading' (never
 * to disabled tabs). Works on touch devices only so it doesn't interfere
 * with mouse interactions.
 *
 * @param {Object}   opts
 * @param {string}   opts.activeTab       - Current active tab id
 * @param {Function} opts.onTabChange     - (tabId) => void
 * @param {string[]} opts.tabOrder        - Ordered tab ids, e.g. ['pinterest','analysis',…]
 * @param {Function} opts.getTabState     - (tabId) => 'completed' | 'loading' | 'pending' | 'disabled'
 * @param {number}   [opts.threshold=60]  - Min horizontal px to count as a swipe
 * @param {boolean}  [opts.enabled=true]  - Master toggle
 * @returns {{ containerRef: React.RefObject }}
 */
export function useSwipeNavigation({
  activeTab,
  onTabChange,
  tabOrder,
  getTabState,
  threshold = 60,
  enabled = true,
}) {
  const containerRef = useRef(null);
  const touchStart = useRef({ x: 0, y: 0 });
  const swiping = useRef(false);

  const handleTouchStart = useCallback((e) => {
    if (!enabled) return;
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
    swiping.current = true;
  }, [enabled]);

  const handleTouchEnd = useCallback((e) => {
    if (!enabled || !swiping.current) return;
    swiping.current = false;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;

    // Ignore if the gesture is more vertical than horizontal
    if (Math.abs(dy) > Math.abs(dx)) return;
    // Ignore if below threshold
    if (Math.abs(dx) < threshold) return;

    const currentIdx = tabOrder.indexOf(activeTab);
    if (currentIdx === -1) return;

    // Swipe left → next tab, swipe right → previous tab
    const direction = dx < 0 ? 1 : -1;
    const targetIdx = currentIdx + direction;

    if (targetIdx < 0 || targetIdx >= tabOrder.length) return;

    const targetTab = tabOrder[targetIdx];
    const state = getTabState(targetTab);

    // Only navigate to accessible tabs
    if (state === 'completed' || state === 'loading' || state === 'pending') {
      onTabChange(targetTab);
    }
  }, [enabled, activeTab, tabOrder, getTabState, onTabChange, threshold]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  return { containerRef };
}

export default useSwipeNavigation;
