import { useCallback, useTransition } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Hook for smooth page transitions using React's useTransition.
 * Wraps navigation in startTransition for non-blocking UI updates.
 */
export function usePageTransition() {
  const [isPending, startTransition] = useTransition();
  const navigate = useNavigate();

  const navigateTo = useCallback(
    (path: string, options?: { replace?: boolean }) => {
      startTransition(() => {
        navigate(path, options);
      });
    },
    [navigate, startTransition]
  );

  return { navigateTo, isPending };
}
