import { useCallback } from "react";

type HapticStyle = "light" | "medium" | "heavy" | "success" | "warning" | "error";

const PATTERNS: Record<HapticStyle, number[]> = {
  light: [10],
  medium: [20],
  heavy: [30],
  success: [10, 50, 20],
  warning: [20, 40, 20, 40, 20],
  error: [40, 30, 40],
};

function vibrate(pattern: number[]) {
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

export function useHaptics() {
  const trigger = useCallback((style: HapticStyle = "light") => {
    vibrate(PATTERNS[style]);
  }, []);

  return { trigger };
}

/** Fire-and-forget haptic — no hook needed */
export function haptic(style: HapticStyle = "light") {
  vibrate(PATTERNS[style]);
}
