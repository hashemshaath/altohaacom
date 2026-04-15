/**
 * Shared utilities for global search queries.
 */

/** Split query into searchable words (>=2 chars) */
export function getSearchWords(query: string): string[] {
  return query
    .trim()
    .split(/\s+/)
    .filter((w) => w.length >= 2);
}

/**
 * Build an OR filter for Supabase that matches ANY of the words in ANY column.
 */
export function buildFlexibleFilter(words: string[], columns: string[]): string {
  const parts: string[] = [];
  for (const word of words) {
    const escaped = word.replace(/[%_]/g, "\\$&");
    for (const col of columns) {
      parts.push(`${col}.ilike.%${escaped}%`);
    }
  }
  return parts.join(",");
}

/**
 * Count how many search words match in the given fields.
 */
export function countMatchingWords(words: string[], ...fields: (string | null | undefined)[]): number {
  if (words.length === 0) return 0;
  const combined = fields.filter(Boolean).join(" ").toLowerCase();
  return words.filter((w) => combined.includes(w.toLowerCase())).length;
}

/** Sort by relevance descending */
export function sortByRelevance<T extends { _relevance?: number }>(items: T[]): T[] {
  return items.sort((a, b) => (b._relevance || 0) - (a._relevance || 0));
}
