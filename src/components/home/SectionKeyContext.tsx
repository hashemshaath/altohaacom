import { createContext, useContext, type ReactNode } from "react";
import { useHomepageSection, type HomepageSection } from "@/hooks/useHomepageSections";

const SectionKeyContext = createContext<string | null>(null);

/** Wraps a homepage section to provide its key via context */
export function SectionKeyProvider({ sectionKey, children }: { sectionKey: string; children: ReactNode }) {
  return (
    <SectionKeyContext.Provider value={sectionKey}>
      {children}
    </SectionKeyContext.Provider>
  );
}

/**
 * Hook for section components to read their own DB config.
 * Returns the HomepageSection row or null if no config exists.
 * Components can use this to respect admin-configured titles, item counts, etc.
 */
export function useSectionConfig(): HomepageSection | null {
  const key = useContext(SectionKeyContext);
  return useHomepageSection(key || "");
}
