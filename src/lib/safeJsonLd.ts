import serialize from "serialize-javascript";

/**
 * Safely serializes a JSON-LD object for embedding in a <script> tag.
 * Escapes `</script>` sequences and other XSS vectors that `JSON.stringify` misses.
 */
export function safeJsonLd(data: Record<string, unknown>): string {
  return serialize(data, { isJSON: true });
}
