import { memo, useCallback } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import { LayoutGrid, Newspaper } from "lucide-react";

export type HomepageLayout = "classic" | "editorial";

const STORAGE_KEY = "homepage-layout";

export function getStoredLayout(): HomepageLayout {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "classic" || v === "editorial") return v;
  } catch {}
  return "editorial";
}

export function setStoredLayout(layout: HomepageLayout) {
  try { localStorage.setItem(STORAGE_KEY, layout); } catch {}
}

export const HomepageLayoutSwitcher = memo(function HomepageLayoutSwitcher({
  current,
  onChange,
}: {
  current: HomepageLayout;
  onChange: (layout: HomepageLayout) => void;
}) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const toggle = useCallback(
    (layout: HomepageLayout) => {
      onChange(layout);
      setStoredLayout(layout);
    },
    [onChange]
  );

  return (
    <div className="fixed bottom-6 end-6 z-50 flex items-center gap-1 rounded-xl bg-card/95 backdrop-blur-md border border-border shadow-lg p-1">
      <button
        onClick={() => toggle("editorial")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200",
          current === "editorial"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
        aria-label={isAr ? "التصميم الجديد" : "New Layout"}
      >
        <Newspaper className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{isAr ? "جديد" : "New"}</span>
      </button>
      <button
        onClick={() => toggle("classic")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200",
          current === "classic"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
        aria-label={isAr ? "التصميم الكلاسيكي" : "Classic Layout"}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{isAr ? "كلاسيكي" : "Classic"}</span>
      </button>
    </div>
  );
});
