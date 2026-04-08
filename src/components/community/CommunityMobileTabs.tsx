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
    <div className="sticky top-12 z-40 border-b border-border/10 bg-background/95 backdrop-blur-xl lg:hidden safe-area-x">
      <div
        className="flex overflow-x-auto scrollbar-none touch-pan-x"
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
                "flex-shrink-0 flex items-center gap-1.5 px-4 py-3 text-xs font-semibold transition-all duration-150 relative touch-manipulation active:scale-[0.96] whitespace-nowrap",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground/50 active:text-foreground"
              )}
            >
              <Icon className={cn(
                "h-4.5 w-4.5 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground/40"
              )} />
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 inset-x-2 h-[2px] rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});
