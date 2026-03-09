/**
 * Accessibility utilities for WCAG 2.1 AA compliance.
 */

/** Generate a unique ID for ARIA relationships */
let counter = 0;
export function generateAriaId(prefix = "aria"): string {
  return `${prefix}-${++counter}-${Date.now().toString(36)}`;
}

/**
 * Check contrast ratio between two colors (hex format).
 * Returns true if contrast meets WCAG AA standard (4.5:1 for normal text, 3:1 for large text).
 */
export function checkContrastRatio(hex1: string, hex2: string, isLargeText = false): boolean {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const ratio = (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
  return ratio >= (isLargeText ? 3 : 4.5);
}

function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = hex.replace("#", "").match(/.{2}/g);
  if (!match || match.length < 3) return null;
  return { r: parseInt(match[0], 16), g: parseInt(match[1], 16), b: parseInt(match[2], 16) };
}

/** Build aria-describedby string from optional IDs */
export function ariaDescribedBy(...ids: (string | undefined | null | false)[]): string | undefined {
  const valid = ids.filter(Boolean) as string[];
  return valid.length > 0 ? valid.join(" ") : undefined;
}

/** Screen reader only text (for use as a component) */
export function srOnly(text: string): string {
  return text;
}
