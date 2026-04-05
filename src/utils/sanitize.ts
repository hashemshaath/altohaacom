import DOMPurify from "dompurify";

/**
 * Sanitize HTML — allows safe formatting tags only.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "b", "i", "u",
      "ul", "ol", "li", "h2", "h3", "h4",
      "a", "blockquote", "span", "sub", "sup",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class"],
    FORBID_ATTR: ["style", "onerror", "onload", "onclick", "onmouseover"],
  });
}

/**
 * Sanitize user-provided CSS to prevent XSS via style injection.
 * Strips dangerous patterns: url(), expression(), @import, javascript:, behaviour, etc.
 */
export function sanitizeCss(dirty: string): string {
  if (!dirty || typeof dirty !== "string") return "";

  return dirty
    // Remove anything that could execute JS
    .replace(/expression\s*\(/gi, "/* blocked */")
    .replace(/javascript\s*:/gi, "/* blocked */")
    .replace(/vbscript\s*:/gi, "/* blocked */")
    .replace(/-moz-binding\s*:/gi, "/* blocked */")
    .replace(/behavior\s*:/gi, "/* blocked */")
    .replace(/behaviour\s*:/gi, "/* blocked */")
    // Remove url() to prevent data-uri / remote resource attacks
    .replace(/url\s*\(/gi, "/* blocked-url */")
    // Remove @import which can load external CSS
    .replace(/@import\b/gi, "/* blocked-import */")
    // Remove HTML comments that can break out of <style>
    .replace(/<!--/g, "")
    .replace(/-->/g, "")
    // Remove closing style tag to prevent injection breakout
    .replace(/<\/?style[^>]*>/gi, "");
}

/**
 * Sanitize a URL — only allows http/https protocols.
 */
export function sanitizeUrl(url: string): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    return parsed.href;
  } catch {
    return "";
  }
}
