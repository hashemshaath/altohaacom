import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AdBanner } from "@/components/ads/AdBanner";
import { ActivitySidebar } from "./ActivitySidebar";
import { TrendingTopics } from "./TrendingTopics";
import { CommunitySearch } from "./CommunitySearch";
import { UpcomingEventsWidget } from "./UpcomingEventsWidget";
import { WeeklyHighlights } from "./WeeklyHighlights";
import { CommunityActivityPulse } from "./CommunityActivityPulse";
import {
  UserPlus, Sparkles,
  PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CACHE } from "@/lib/queryConfig";

interface CommunityRightSidebarProps {
  rightSidebarOpen: boolean;
  setRightSidebarOpen: (open: boolean) => void;
}

export const CommunityRightSidebar = memo(function CommunityRightSidebar({ rightSidebarOpen, setRightSidebarOpen }: CommunityRightSidebarProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAr = language === "ar";

  const { data: suggestedUsers = [] } = useQuery({
    queryKey: ["community-suggested-users", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, full_name_ar, display_name, display_name_ar, username, avatar_url, is_verified, specialization")
        .eq("account_status", "active")
        .neq("user_id", user?.id || "")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: CACHE.long.staleTime,
  });

  return (
    <aside className={cn(
      "hidden xl:flex flex-col shrink-0 sticky top-14 self-start py-3 transition-all duration-300 ease-in-out max-h-[calc(100vh-3.5rem)] overflow-y-auto scrollbar-none",
      rightSidebarOpen ? "w-[280px]" : "w-[52px]"
    )}>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 mb-2 self-start rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/40"
        onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
        aria-label={rightSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {rightSidebarOpen
          ? (isAr ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelRightClose className="h-3.5 w-3.5" />)
          : (isAr ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />)
        }
      </Button>

      {rightSidebarOpen && (
        <div className="space-y-3">
          <CommunitySearch />
          <CommunityActivityPulse />
          <TrendingTopics />
          <WeeklyHighlights />
          <UpcomingEventsWidget />
          <ActivitySidebar />

          {/* Who to Follow */}
          {suggestedUsers.length > 0 && (
            <div className="rounded-xl bg-muted/15 overflow-hidden">
              <h3 className="px-3 pt-3 pb-1.5 text-[13px] font-semibold flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-chart-4" />
                {isAr ? "من تتابع" : "Who to Follow"}
              </h3>
              <div className="divide-y divide-border/10">
                {suggestedUsers.slice(0, 3).map((profile) => {
                  const name = isAr
                    ? (profile.display_name_ar || profile.full_name_ar || profile.display_name || profile.full_name || profile.username)
                    : (profile.display_name || profile.full_name || profile.username);
                  return (
                    <div
                      key={profile.user_id}
                      className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => navigate(`/chef/${profile.user_id}`)}
                      role="button"
                      tabIndex={0}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback className="text-[11px] font-semibold bg-muted/40">
                          {(name || "U")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold truncate flex items-center gap-1">
                          {name}
                          {profile.is_verified && (
                            <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[7px]">✓</span>
                          )}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 truncate">
                          {profile.specialization || (isAr ? "طاهٍ" : "Chef")}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] rounded-md px-2 text-primary hover:bg-primary/10 font-semibold">
                        <UserPlus className="h-3 w-3 me-0.5" />
                        {isAr ? "تابع" : "Follow"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <AdBanner placementSlug="sidebar" className="rounded-xl overflow-hidden" />

          <div className="px-3 py-2">
            <p className="text-[10px] text-muted-foreground/30 leading-relaxed">
              {isAr ? "الشروط · الخصوصية · حول" : "Terms · Privacy · About"}
              {" "}© {new Date().getFullYear()} Altoha
            </p>
          </div>
        </div>
      )}
    </aside>
  );
});
