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

interface SectionRuntimeConfig {
  section_key: string;
  is_visible: boolean;
  sort_order: number;
}

function SectionShellBoundary({ sectionKey, index, children }: { sectionKey: string; index: number; children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="container py-4">
          <div className="min-h-[60px]" />
        </div>
      }
    >
      <Suspense fallback={<HomeSectionSkeleton index={index} />}>
        <SectionKeyProvider sectionKey={sectionKey}>
          <HomepageSectionShell>{children}</HomepageSectionShell>
        </SectionKeyProvider>
      </Suspense>
    </ErrorBoundary>
  );
}

export function HomeSectionsRenderer({ sections }: HomeSectionsRendererProps) {
  const orderedSections = useMemo<SectionRuntimeConfig[]>(() => {
    if (sections.length > 0) {
      return sections
        .filter((section) => section.is_visible && section.section_key !== "hero")
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(({ section_key, is_visible, sort_order }) => ({
          section_key,
          is_visible,
          sort_order,
        }));
    }

    return DEFAULT_HOME_SECTION_KEYS.map((section_key, i) => ({
      section_key,
      is_visible: true,
      sort_order: i + 1,
    }));
  }, [sections]);

  return (
    <>
      {orderedSections.map((section, index) => {
        const sectionKey = section.section_key;
        const SectionComponent = HOME_SECTION_COMPONENTS[sectionKey];
        const renderKey = `${sectionKey}-${section.sort_order}-${index}`;

        if (!SectionComponent) {
          return (
            <SectionShellBoundary key={renderKey} sectionKey={sectionKey} index={index}>
              <GenericHomepageSection sectionKey={sectionKey} />
            </SectionShellBoundary>
          );
        }

        return (
          <SectionShellBoundary key={renderKey} sectionKey={sectionKey} index={index}>
            <SectionComponent />
          </SectionShellBoundary>
        );
      })}
    </>
  );
}
