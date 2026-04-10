/**
 * Centralized scroll event manager.
 *
 * Instead of N components each adding `window.addEventListener("scroll", ...)`,
 * this module keeps a single RAF-throttled listener and broadcasts to subscribers.
 *
 * Benefits:
 * - Single scroll listener for the entire app
 * - RAF-throttled (no jank from multiple handlers)
 * - Auto-cleanup on last unsubscribe
 */

type ScrollCallback = (scrollY: number) => void;

const subscribers = new Set<ScrollCallback>();
let rafId = 0;
let listening = false;

function onScroll() {
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => {
    const y = window.scrollY;
    subscribers.forEach((cb) => {
      try {
        cb(y);
      } catch {
        // Never let one subscriber crash others
      }
    });
  });
}

function startListening() {
  if (listening) return;
  listening = true;
  window.addEventListener("scroll", onScroll, { passive: true });
}

function stopListening() {
  if (!listening) return;
  listening = false;
  window.removeEventListener("scroll", onScroll);
  cancelAnimationFrame(rafId);
}

/**
 * Subscribe to scroll events. Returns an unsubscribe function.
 *
 * ```ts
 * const unsub = subscribeScroll((scrollY) => {
 *   setVisible(scrollY > 300);
 * });
 * // later:
 * unsub();
 * ```
 */
export function subscribeScroll(cb: ScrollCallback): () => void {
  subscribers.add(cb);
  startListening();

  // Fire immediately with current position
  cb(window.scrollY);

  return () => {
    subscribers.delete(cb);
    if (subscribers.size === 0) {
      stopListening();
    }
  };
}
