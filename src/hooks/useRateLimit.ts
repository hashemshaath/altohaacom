/**
 * Client-side rate limiter using sessionStorage.
 * Not a security boundary — just UX protection against rapid repeat submissions.
 */
export function useRateLimit(key: string, maxAttempts: number, windowMs: number) {
  const storageKey = `rl_${key}`;

  const getAttempts = (): { count: number; windowStart: number } => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return { count: 0, windowStart: Date.now() };
      const data = JSON.parse(raw);
      if (Date.now() - data.windowStart > windowMs) {
        return { count: 0, windowStart: Date.now() };
      }
      return data;
    } catch {
      return { count: 0, windowStart: Date.now() };
    }
  };

  const checkLimit = (): boolean => {
    const attempts = getAttempts();
    if (attempts.count >= maxAttempts) return false;
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({ count: attempts.count + 1, windowStart: attempts.windowStart })
    );
    return true;
  };

  const isLimited = getAttempts().count >= maxAttempts;

  return { checkLimit, isLimited };
}
