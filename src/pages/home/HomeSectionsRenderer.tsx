import { Suspense, useMemo, useState, useEffect, useRef, forwardRef } from "react";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
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

/** Suspense fallback with a built-in timeout to prevent infinite loading */
const TimedSkeleton = forwardRef<HTMLDivElement, { index: number }>(function TimedSkeleton({ index }, ref) {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  if (timedOut) {
    return <div ref={ref} className="container py-4"><div className="min-h-[40px]" /></div>;
  }

  return <HomeSectionSkeleton ref={ref} index={index} />;
});

/** Number of sections to render immediately (above-fold) */
const EAGER_SECTION_COUNT = 5;

/** Wrapper that defers rendering until near viewport */
const DeferredSection = forwardRef<HTMLDivElement, { children: React.ReactNode; index: number }>(function DeferredSection({ children, index }, outerRef) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { rootMargin: "600px 0px", threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (inView) return <>{children}</>;

  return (
    <div ref={innerRef} className="section-deferred">
      <HomeSectionSkeleton index={index} />
    </div>
  );
});

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
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

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

  if (!hasMounted) {
    return (
      <>
        {[0, 1, 2].map((index) => (
          <HomeSectionSkeleton key={`home-boot-skeleton-${index}`} index={index} />
        ))}
      </>
    );
  }

  return (
    <>
      {ordered.map((entry, index) => {
        const sectionKey = entry.section_key;
        const Component = HOME_SECTION_COMPONENTS[sectionKey];
        const isAboveFold = index < EAGER_SECTION_COUNT;

        const sectionContent = (
          <SectionErrorBoundary key={`${sectionKey}-${entry.sort_order}-${index}`} name={sectionKey} variant="compact">
            <Suspense fallback={<TimedSkeleton index={index} />}>
              <SectionKeyProvider sectionKey={sectionKey}>
                <HomepageSectionShell visibleIndex={index}>
                  {Component ? <Component /> : <GenericHomepageSection sectionKey={sectionKey} />}
                </HomepageSectionShell>
              </SectionKeyProvider>
            </Suspense>
          </SectionErrorBoundary>
        );

        // Above-fold sections render immediately; below-fold defer until near viewport
        if (isAboveFold) return sectionContent;

        return (
          <DeferredSection key={`${sectionKey}-${entry.sort_order}-${index}`} index={index}>
            {sectionContent}
          </DeferredSection>
        );
      })}
    </>
  );
}
