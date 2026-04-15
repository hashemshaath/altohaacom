import DOMPurify from "dompurify";

/**
 * Sanitize HTML — allows safe formatting tags only.
 */
function sanitizeHtml(dirty: string): string {
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

  // Limit length to prevent ReDoS / abuse
  const trimmed = dirty.slice(0, 10_000);

  return trimmed
    // Remove anything that could execute JS
    .replace(/expression\s*\(/gi, "/* blocked */")
    .replace(/javascript\s*:/gi, "/* blocked */")
    .replace(/vbscript\s*:/gi, "/* blocked */")
    .replace(/-moz-binding\s*:/gi, "/* blocked */")
    .replace(/behavior\s*:/gi, "/* blocked */")
    .replace(/behaviour\s*:/gi, "/* blocked */")
    // Block -webkit-/-moz- specific XSS vectors
    .replace(/-webkit-[a-z-]*\s*:\s*[^;]*expression/gi, "/* blocked */")
    // Remove url() to prevent data-uri / remote resource attacks
    .replace(/url\s*\(/gi, "/* blocked-url */")
    // Remove @import which can load external CSS
    .replace(/@import\b/gi, "/* blocked-import */")
    // Remove @charset which can manipulate encoding
    .replace(/@charset\b/gi, "/* blocked-charset */")
    // Remove @namespace for XML-based attacks
    .replace(/@namespace\b/gi, "/* blocked-namespace */")
    // Remove HTML comments that can break out of <style>
    .replace(/<!--/g, "")
    .replace(/-->/g, "")
    // Remove any HTML tags to prevent injection breakout
    .replace(/<\/?[a-z][^>]*>/gi, "")
    // Remove null bytes and control characters
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "");
}

/**
 * Sanitize a URL — only allows http/https protocols.
 */
function sanitizeUrl(url: string): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    return parsed.href;
  } catch {
    return "";
  }
}

/**
 * Sanitize a filename — strips unsafe characters and limits length.
 */
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 100);
}
