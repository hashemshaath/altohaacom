import { useMemo } from "react";
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

export function CommunityMobileTabs({ activeTab, setActiveTab }: CommunityMobileTabsProps) {
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

  const tabs = allTabs.filter(tab => {
    const featureCode = TAB_FEATURE_MAP[tab.id];
    if (featureCode && enabledFeatures && !enabledFeatures.has(featureCode)) return false;
    return true;
  });

  return (
    <div className="sticky top-12 z-40 border-b border-border/40 bg-background/90 backdrop-blur-xl lg:hidden">
      <div className="relative">
        <div className="flex overflow-x-auto scrollbar-none snap-x snap-mandatory" role="tablist">
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
                  "snap-start flex-shrink-0 flex flex-col items-center gap-1 px-4 py-2.5 text-[10px] font-bold transition-all relative touch-manipulation active:scale-95",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200",
                  isActive && "bg-primary/10 scale-110"
                )}>
                  <Icon className={cn("h-4 w-4 transition-colors", isActive ? "text-primary" : "text-muted-foreground/70")} />
                </div>
                <span className="whitespace-nowrap leading-none">{tab.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 inset-x-2 h-0.5 rounded-full bg-primary shadow-sm shadow-primary/30" />
                )}
              </button>
            );
          })}
        </div>
        {/* Right fade scroll hint */}
        <div className="pointer-events-none absolute end-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background/90 to-transparent" />
      </div>
    </div>
  );
}
