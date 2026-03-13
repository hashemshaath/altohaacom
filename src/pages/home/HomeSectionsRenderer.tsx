import { Suspense, useMemo } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SectionKeyProvider } from "@/components/home/SectionKeyContext";
import { HomepageSectionShell } from "@/components/home/HomepageSectionShell";
import GenericHomepageSection from "@/components/home/sections/GenericHomepageSection";
import { type HomepageSection } from "@/hooks/useHomepageSections";
import { HomeSectionSkeleton } from "./HomeSectionSkeleton";
import { DEFAULT_HOME_SECTION_KEYS, HOME_SECTION_COMPONENTS } from "./homeSectionRegistry";

interface HomeSectionsRendererProps {
  sections: HomepageSection[];
}

interface SectionEntry {
  section_key: string;
  sort_order: number;
}

const SECTION_ERROR_FALLBACK = (
  <div className="container py-4">
    <div className="min-h-[60px]" />
  </div>
);

function normalizeEntries(entries: SectionEntry[]) {
  const deduped = new Map<string, SectionEntry>();

  entries.forEach((entry, index) => {
    const key = entry.section_key?.trim();
    if (!key || key === "hero") return;

    const candidate: SectionEntry = {
      section_key: key,
      sort_order: Number.isFinite(entry.sort_order) ? entry.sort_order : index + 1,
    };

    const existing = deduped.get(key);
    if (!existing || candidate.sort_order < existing.sort_order) {
      deduped.set(key, candidate);
    }
  });

  return Array.from(deduped.values()).sort((a, b) => a.sort_order - b.sort_order);
}

export function HomeSectionsRenderer({ sections }: HomeSectionsRendererProps) {
  const ordered = useMemo<SectionEntry[]>(() => {
    const configured = sections.length
      ? sections
          .filter((section) => section.is_visible && section.section_key !== "hero")
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(({ section_key, sort_order }) => ({ section_key, sort_order }))
      : [];

    const normalizedConfigured = normalizeEntries(configured);
    if (normalizedConfigured.length > 0) return normalizedConfigured;

    return DEFAULT_HOME_SECTION_KEYS.map((key, index) => ({
      section_key: key,
      sort_order: index + 1,
    }));
  }, [sections]);

  return (
    <>
      {ordered.map((entry, index) => {
        const sectionKey = entry.section_key;
        const Component = HOME_SECTION_COMPONENTS[sectionKey];

        return (
          <ErrorBoundary key={`${sectionKey}-${entry.sort_order}-${index}`} fallback={SECTION_ERROR_FALLBACK}>
            <Suspense fallback={<HomeSectionSkeleton index={index} />}>
              <SectionKeyProvider sectionKey={sectionKey}>
                <HomepageSectionShell>
                  {Component ? <Component /> : <GenericHomepageSection sectionKey={sectionKey} />}
                </HomepageSectionShell>
              </SectionKeyProvider>
            </Suspense>
          </ErrorBoundary>
        );
      })}
    </>
  );
}

