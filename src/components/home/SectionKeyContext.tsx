import { createContext, forwardRef, useContext, type ReactNode } from "react";
import { useHomepageSection, type HomepageSection } from "@/hooks/useHomepageSections";

const SectionKeyContext = createContext<string | null>(null);

export const SectionKeyProvider = forwardRef<unknown, { sectionKey: string; children: ReactNode }>(function SectionKeyProvider(
  { sectionKey, children },
  _ref
) {
  return <SectionKeyContext.Provider value={sectionKey}>{children}</SectionKeyContext.Provider>;
});
SectionKeyProvider.displayName = "SectionKeyProvider";

export function useSectionConfig(): HomepageSection | null {
  const key = useContext(SectionKeyContext);
  return useHomepageSection(key || "");
}
