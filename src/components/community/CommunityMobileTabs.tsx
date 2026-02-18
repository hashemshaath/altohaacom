import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Newspaper, CalendarDays, UsersRound, UserPlus, Users, BookOpen, Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommunityTab } from "./CommunityLeftSidebar";

interface CommunityMobileTabsProps {
  activeTab: CommunityTab;
  setActiveTab: (tab: CommunityTab) => void;
}

export function CommunityMobileTabs({ activeTab, setActiveTab }: CommunityMobileTabsProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const tabs: { id: CommunityTab; label: string; icon: any; requiresAuth?: boolean }[] = [
    { id: "feed", label: isAr ? "مساحتي" : "My Space", icon: Newspaper },
    { id: "chefs", label: isAr ? "الطهاة" : "Chefs", icon: Users },
    { id: "recipes", label: isAr ? "الوصفات" : "Recipes", icon: BookOpen },
    { id: "groups", label: isAr ? "المجموعات" : "Groups", icon: UsersRound },
    { id: "events", label: isAr ? "الفعاليات" : "Events", icon: CalendarDays },
    { id: "live", label: isAr ? "جلسات مباشرة" : "Live Sessions", icon: Radio },
    { id: "network", label: isAr ? "شبكتي" : "My Network", icon: UserPlus, requiresAuth: true },
  ];

  return (
    <div className="sticky top-[56px] z-40 border-b border-border/40 bg-background/90 backdrop-blur-xl lg:hidden">
      <div className="flex overflow-x-auto scrollbar-none snap-x snap-mandatory">
        {tabs.filter(t => !t.requiresAuth || user).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "snap-start flex-shrink-0 px-4 py-3 text-sm font-bold transition-colors relative",
              activeTab === tab.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 inset-x-2 h-0.5 rounded-full bg-primary shadow-sm shadow-primary/30" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
