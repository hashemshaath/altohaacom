import { lazy, type ComponentType } from "react";

/**
 * Safe lazy loader with retry logic for chunk loading failures.
 * Retries up to 3 times with exponential backoff before giving up.
 */
export function safeLazy<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 3
) {
  return lazy(() => {
    let attempts = 0;

    const load = (): Promise<{ default: T }> =>
      factory().catch((err) => {
        attempts++;
        if (attempts >= retries) {
          console.error(`[safeLazy] Failed after ${retries} attempts:`, err);
          // Return a fallback empty component to prevent white screen
          return {
            default: (() => null) as unknown as T,
          };
        }
        // Exponential backoff: 500ms, 1000ms, 2000ms
        return new Promise<{ default: T }>((resolve) =>
          setTimeout(() => resolve(load()), 500 * Math.pow(2, attempts - 1))
        );
      });

    return load();
  });
}
