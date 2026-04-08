import { useMemo, memo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Newspaper, CalendarDays, UsersRound, UserPlus, Users, BookOpen, Radio, Bookmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommunityTab } from "./CommunityLeftSidebar";
import { useUserFeatures } from "@/hooks/useMembershipFeatures";

interface CommunityMobileTabsProps {
  activeTab: CommunityTab;
  setActiveTab: (tab: CommunityTab) => void;
}

const TAB_FEATURE_MAP: Record<string, string> = {
  live: "feature_live_sessions",
};

export const CommunityMobileTabs = memo(function CommunityMobileTabs({ activeTab, setActiveTab }: CommunityMobileTabsProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: enabledFeatures } = useUserFeatures();

  const tabs = useMemo(() => {
    const allTabs: { id: CommunityTab; label: string; icon: any; requiresAuth?: boolean }[] = [
      { id: "feed", label: isAr ? "الرئيسية" : "Feed", icon: Newspaper },
      { id: "chefs", label: isAr ? "الطهاة" : "Chefs", icon: Users },
      { id: "recipes", label: isAr ? "الوصفات" : "Recipes", icon: BookOpen },
      { id: "groups", label: isAr ? "المجموعات" : "Groups", icon: UsersRound },
      { id: "events", label: isAr ? "الفعاليات" : "Events", icon: CalendarDays },
      { id: "live", label: isAr ? "مباشر" : "Live", icon: Radio },
      { id: "bookmarks", label: isAr ? "المحفوظات" : "Saved", icon: Bookmark, requiresAuth: true },
      { id: "network", label: isAr ? "شبكتي" : "Network", icon: UserPlus, requiresAuth: true },
    ];
    return allTabs.filter(tab => {
      const featureCode = TAB_FEATURE_MAP[tab.id];
      if (featureCode && enabledFeatures && !enabledFeatures.has(featureCode)) return false;
      return true;
    });
  }, [isAr, enabledFeatures]);

  return (
    <div className="sticky top-12 z-40 border-b border-border/20 bg-background/98 backdrop-blur-xl lg:hidden safe-area-x">
      <div
        className="flex overflow-x-auto scrollbar-none touch-pan-x gap-0.5 px-1"
        role="tablist"
      >
        {tabs.filter(t => !t.requiresAuth || user).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-shrink-0 flex flex-col items-center gap-0.5 px-3 pt-2 pb-1.5 min-w-[56px] text-[11px] font-semibold transition-all duration-200 relative touch-manipulation active:scale-[0.96]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground/70 active:text-foreground"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 transition-all duration-200",
                isActive ? "text-primary scale-110" : "text-muted-foreground/50"
              )} />
              <span className="whitespace-nowrap leading-tight">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 inset-x-2 h-[2.5px] rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});
