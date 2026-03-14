import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import { Flame, UserCheck, Clock, Bookmark } from "lucide-react";

export type FeedFilter = "for_you" | "following" | "latest" | "bookmarks";

interface FeedTabsProps {
  active: FeedFilter;
  onChange: (tab: FeedFilter) => void;
  isLoggedIn: boolean;
}

export const FeedTabs = memo(function FeedTabs({ active, onChange, isLoggedIn }: FeedTabsProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const tabs: { id: FeedFilter; label: string; icon: any; requiresAuth?: boolean }[] = [
    { id: "for_you", label: isAr ? "لك" : "For You", icon: Flame },
    { id: "following", label: isAr ? "المتابَعون" : "Following", icon: UserCheck, requiresAuth: true },
    { id: "latest", label: isAr ? "الأحدث" : "Latest", icon: Clock },
    { id: "bookmarks", label: isAr ? "المحفوظات" : "Saved", icon: Bookmark, requiresAuth: true },
  ];

  return (
    <div className="flex border-b border-border/40 sticky top-0 z-10 bg-background/95 backdrop-blur-md">
      {tabs
        .filter((t) => !t.requiresAuth || isLoggedIn)
        .map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold transition-all relative",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
              )}
            >
              <tab.icon className={cn("h-4 w-4", isActive && "text-primary")} />
              <span className="hidden sm:inline">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 inset-x-6 h-[2.5px] rounded-full bg-primary" />
              )}
            </button>
          );
        })}
    </div>
  );
});
