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
    <div className="flex border-b border-border/30 sticky top-0 lg:top-0 z-10 bg-background/98 backdrop-blur-xl">
      {tabs
        .filter((t) => !t.requiresAuth || isLoggedIn)
        .map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 min-h-[48px] text-[14px] sm:text-sm font-semibold transition-all duration-200 relative touch-manipulation active:scale-[0.98]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/20 active:text-foreground"
              )}
            >
              <tab.icon className={cn(
                "h-4 w-4 transition-colors duration-200",
                isActive ? "text-primary" : "text-muted-foreground/60"
              )} />
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 inset-x-4 h-[3px] rounded-full bg-primary transition-all duration-300" />
              )}
            </button>
          );
        })}
    </div>
  );
});
