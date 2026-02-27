import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Hook to add structured data (JSON-LD) for key pages.
 * Call in page components to improve SEO.
 */
export function useStructuredData(data: Record<string, unknown> | null) {
  const location = useLocation();

  useEffect(() => {
    if (!data) return;

    const existing = document.querySelector('script[data-structured-data]');
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-structured-data", "true");
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      ...data,
    });
    document.head.appendChild(script);

    return () => {
      const el = document.querySelector('script[data-structured-data]');
      if (el) el.remove();
    };
  }, [data, location.pathname]);
}

/** Pre-built structured data for the homepage */
export function useHomepageStructuredData() {
  useStructuredData({
    "@type": "WebSite",
    name: "Altoha - الطهاة",
    url: window.location.origin,
    description: "Professional culinary social network and competition management platform",
    potentialAction: {
      "@type": "SearchAction",
      target: `${window.location.origin}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  });
}

/** Structured data for competition pages */
export function useCompetitionStructuredData(comp: {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  url: string;
} | null) {
  useStructuredData(comp ? {
    "@type": "Event",
    name: comp.name,
    description: comp.description,
    startDate: comp.startDate,
    endDate: comp.endDate,
    location: comp.location ? {
      "@type": "Place",
      name: comp.location,
    } : undefined,
    url: comp.url,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    organizer: {
      "@type": "Organization",
      name: "Altoha",
      url: window.location.origin,
    },
  } : null);
}
