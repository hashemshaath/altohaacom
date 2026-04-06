import { useEffect } from "react";

/**
 * Injects rel="prev" and rel="next" <link> tags for paginated pages.
 * Helps search engines discover and associate paginated content.
 *
 * @param page - Current 1-based page number
 * @param totalPages - Total number of pages
 * @param baseUrl - Base URL path without page param (e.g. "/competitions")
 * @param paramName - Query parameter name for page (default: "page")
 */
export function useSEOPagination(
  page: number,
  totalPages: number,
  baseUrl: string,
  paramName = "page"
) {
  useEffect(() => {
    if (totalPages <= 1) return;

    const origin = window.location.origin;
    const buildUrl = (p: number) => {
      if (p === 1) return `${origin}${baseUrl}`;
      return `${origin}${baseUrl}?${paramName}=${p}`;
    };

    const links: HTMLLinkElement[] = [];

    // rel="prev"
    if (page > 1) {
      const prev = document.createElement("link");
      prev.rel = "prev";
      prev.href = buildUrl(page - 1);
      document.head.appendChild(prev);
      links.push(prev);
    }

    // rel="next"
    if (page < totalPages) {
      const next = document.createElement("link");
      next.rel = "next";
      next.href = buildUrl(page + 1);
      document.head.appendChild(next);
      links.push(next);
    }

    return () => {
      links.forEach((l) => l.remove());
    };
  }, [page, totalPages, baseUrl, paramName]);
}
