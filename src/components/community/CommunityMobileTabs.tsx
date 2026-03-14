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

  const allTabs: { id: CommunityTab; label: string; icon: any; requiresAuth?: boolean }[] = [
    { id: "feed", label: isAr ? "الرئيسية" : "Feed", icon: Newspaper },
    { id: "chefs", label: isAr ? "الطهاة" : "Chefs", icon: Users },
    { id: "recipes", label: isAr ? "الوصفات" : "Recipes", icon: BookOpen },
    { id: "groups", label: isAr ? "المجموعات" : "Groups", icon: UsersRound },
    { id: "events", label: isAr ? "الفعاليات" : "Events", icon: CalendarDays },
    { id: "live", label: isAr ? "مباشرة" : "Live", icon: Radio },
    { id: "bookmarks", label: isAr ? "المحفوظات" : "Saved", icon: Bookmark, requiresAuth: true },
    { id: "network", label: isAr ? "شبكتي" : "Network", icon: UserPlus, requiresAuth: true },
  ];

  const tabs = useMemo(() => allTabs.filter(tab => {
    const featureCode = TAB_FEATURE_MAP[tab.id];
    if (featureCode && enabledFeatures && !enabledFeatures.has(featureCode)) return false;
    return true;
  }), [allTabs, enabledFeatures]);

  return (
    <div className="sticky top-12 z-40 border-b border-border/30 bg-background/95 backdrop-blur-xl lg:hidden">
      <div className="flex overflow-x-auto scrollbar-none" role="tablist">
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
                "flex-shrink-0 flex items-center gap-1.5 px-4 py-3 text-xs font-semibold transition-all relative active:scale-95",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground/60")} />
              <span className="whitespace-nowrap">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 inset-x-3 h-[2px] rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});
