import { createContext, useContext, type ReactNode } from "react";
import { useHomepageSection, type HomepageSection } from "@/hooks/useHomepageSections";

const SectionKeyContext = createContext<string | null>(null);

export function SectionKeyProvider({ sectionKey, children }: { sectionKey: string; children: ReactNode }) {
  return <SectionKeyContext.Provider value={sectionKey}>{children}</SectionKeyContext.Provider>;
}

export function useSectionConfig(): HomepageSection | null {
  const key = useContext(SectionKeyContext);
  return useHomepageSection(key || "");
}
