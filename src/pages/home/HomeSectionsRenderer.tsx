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

export function HomeSectionsRenderer({ sections }: HomeSectionsRendererProps) {
  const ordered = useMemo<SectionEntry[]>(() => {
    if (sections.length > 0) {
      return sections
        .filter((s) => s.is_visible && s.section_key !== "hero")
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(({ section_key, sort_order }) => ({ section_key, sort_order }));
    }
    return DEFAULT_HOME_SECTION_KEYS.map((key, i) => ({
      section_key: key,
      sort_order: i + 1,
    }));
  }, [sections]);

  return (
    <>
      {ordered.map((entry, index) => {
        const { section_key } = entry;
        const Component = HOME_SECTION_COMPONENTS[section_key];

        return (
          <ErrorBoundary key={`${section_key}-${entry.sort_order}`} fallback={SECTION_ERROR_FALLBACK}>
            <Suspense fallback={<HomeSectionSkeleton index={index} />}>
              <SectionKeyProvider sectionKey={section_key}>
                <HomepageSectionShell>
                  {Component ? <Component /> : <GenericHomepageSection sectionKey={section_key} />}
                </HomepageSectionShell>
              </SectionKeyProvider>
            </Suspense>
          </ErrorBoundary>
        );
      })}
    </>
  );
}
