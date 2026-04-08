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
    staleTime: 1000 * 60 * 10,
  });

  return (
    <aside className={cn(
      "hidden xl:flex flex-col shrink-0 sticky top-12 self-start py-3 ps-1 transition-all duration-300 ease-in-out max-h-[calc(100vh-3rem)] overflow-y-auto scrollbar-none",
      rightSidebarOpen ? "w-[280px]" : "w-[48px]"
    )}>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 mb-2 self-start rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
        onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
      >
        {rightSidebarOpen
          ? (isAr ? <PanelLeftClose className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />)
          : (isAr ? <PanelLeftOpen className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />)
        }
      </Button>

      {rightSidebarOpen && (
        <div className="space-y-3">
          {/* Search */}
          <CommunitySearch />

          {/* Live activity pulse */}
          <CommunityActivityPulse />

          {/* Trending Topics */}
          <TrendingTopics />

          {/* Weekly Highlights */}
          <WeeklyHighlights />

          {/* Upcoming Events */}
          <UpcomingEventsWidget />

          {/* Activity Feed */}
          <ActivitySidebar />

          {/* Who to Follow */}
          {suggestedUsers.length > 0 && (
            <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
              <h3 className="px-4 pt-3 pb-2 text-sm font-bold flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-chart-4" />
                {isAr ? "من تتابع" : "Who to Follow"}
              </h3>
              <div className="divide-y divide-border/20">
                {suggestedUsers.slice(0, 3).map((profile) => {
                  const name = isAr
                    ? (profile.display_name_ar || profile.full_name_ar || profile.display_name || profile.full_name || profile.username)
                    : (profile.display_name || profile.full_name || profile.username);
                  return (
                    <div
                      key={profile.user_id}
                      className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/chef/${profile.user_id}`)}
                    >
                      <Avatar className="h-8 w-8 rounded-xl">
                        <AvatarImage src={profile.avatar_url || undefined} className="rounded-xl" />
                        <AvatarFallback className="rounded-xl text-[12px] font-bold bg-muted">
                          {(name || "U")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate flex items-center gap-1">
                          {name}
                          {profile.is_verified && (
                            <Badge variant="secondary" className="h-3.5 w-3.5 p-0 rounded-full bg-primary/10 text-primary text-[7px]">✓</Badge>
                          )}
                        </p>
                        <p className="text-[12px] text-muted-foreground truncate">
                          {profile.specialization || (isAr ? "طاهٍ" : "Chef")}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="h-6 text-[12px] rounded-lg px-2.5 border-border/40 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors">
                        <UserPlus className="h-3 w-3 me-1" />
                        {isAr ? "تابع" : "Follow"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ad */}
          <AdBanner placementSlug="sidebar" className="rounded-2xl overflow-hidden" />

          {/* Footer */}
          <div className="px-3 py-2">
            <p className="text-[12px] text-muted-foreground/50 leading-relaxed">
              {isAr ? "الشروط · الخصوصية · سياسة ملفات تعريف الارتباط · حول" : "Terms · Privacy · Cookie Policy · About"}
              <br />
              © {new Date().getFullYear()} Altoha
            </p>
          </div>
        </div>
      )}
    </aside>
  );
});
