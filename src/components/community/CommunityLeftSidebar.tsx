import { useIsAr } from "@/hooks/useIsAr";
import { useMemo, memo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Newspaper, ChefHat, CalendarDays, UsersRound, UserPlus, Users, BookOpen,
  PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Radio, Bookmark, LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { OnlineCountBadge } from "./PresenceIndicator";
import { ProfileCompletionCard } from "@/components/onboarding/ProfileCompletionCard";
import { useUserFeatures } from "@/hooks/useMembershipFeatures";
import { CACHE } from "@/lib/queryConfig";

export type CommunityTab = "feed" | "chefs" | "recipes" | "groups" | "events" | "network" | "live" | "bookmarks";

interface CommunityLeftSidebarProps {
  activeTab: CommunityTab;
  setActiveTab: (tab: CommunityTab) => void;
  leftSidebarOpen: boolean;
  setLeftSidebarOpen: (open: boolean) => void;
}

export const CommunityLeftSidebar = memo(function CommunityLeftSidebar({ activeTab, setActiveTab, leftSidebarOpen, setLeftSidebarOpen }: CommunityLeftSidebarProps) {
  const { user } = useAuth();
  const isAr = useIsAr();

  const { data: profile } = useQuery({
    queryKey: ["community-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, full_name_ar, display_name, display_name_ar, avatar_url, username")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
    ...CACHE.realtime,
  });

  const { data: stats = { members: 0, groups: 0, recipes: 0, posts: 0 } } = useQuery({
    queryKey: ["community-stats"],
    queryFn: async () => {
      const [membersRes, groupsRes, recipesRes, postsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("groups").select("id", { count: "exact", head: true }),
        supabase.from("recipes").select("id", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("posts").select("id", { count: "exact", head: true }).is("reply_to_post_id", null),
      ]);
      return {
        members: membersRes.count || 0,
        groups: groupsRes.count || 0,
        recipes: recipesRes.count || 0,
        posts: postsRes.count || 0,
      };
    },
    staleTime: CACHE.medium.staleTime,
  });

  const { data: enabledFeatures } = useUserFeatures();

  const TAB_FEATURE_MAP: Record<string, string> = {
    live: "feature_live_sessions",
  };

  const tabs = useMemo(() => {
    const allTabs: { id: CommunityTab; label: string; icon: LucideIcon; requiresAuth?: boolean }[] = [
      { id: "feed", label: isAr ? "الرئيسية" : "Feed", icon: Newspaper },
      { id: "chefs", label: isAr ? "الطهاة" : "Chefs", icon: Users },
      { id: "recipes", label: isAr ? "الوصفات" : "Recipes", icon: BookOpen },
      { id: "groups", label: isAr ? "المجموعات" : "Groups", icon: UsersRound },
      { id: "events", label: isAr ? "الفعاليات" : "Events", icon: CalendarDays },
      { id: "live", label: isAr ? "جلسات مباشرة" : "Live Sessions", icon: Radio },
      { id: "bookmarks", label: isAr ? "المحفوظات" : "Bookmarks", icon: Bookmark, requiresAuth: true },
      { id: "network", label: isAr ? "شبكتي" : "My Network", icon: UserPlus, requiresAuth: true },
    ];
    return allTabs.filter(tab => {
      const featureCode = TAB_FEATURE_MAP[tab.id];
      if (!featureCode) return true;
      if (!enabledFeatures) return true;
      return enabledFeatures.has(featureCode);
    });
  }, [isAr, enabledFeatures]);

  const displayName = profile
    ? (isAr ? (profile.display_name_ar || profile.display_name) : profile.display_name) || profile.full_name
    : null;

  return (
    <aside className={cn(
      "hidden lg:flex flex-col shrink-0 sticky top-14 self-start py-3 transition-all duration-300 ease-in-out max-h-[calc(100vh-3.5rem)] overflow-y-auto scrollbar-none",
      leftSidebarOpen ? "w-[220px]" : "w-[52px]"
    )}>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 mb-2 self-end rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/40"
        onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
        aria-label={leftSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {leftSidebarOpen
          ? (isAr ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />)
          : (isAr ? <PanelRightOpen className="h-3.5 w-3.5" /> : <PanelLeftOpen className="h-3.5 w-3.5" />)
        }
      </Button>

      {/* Profile card */}
      {user && profile && leftSidebarOpen && (
        <Link
          to={`/${profile.username || user.id}`}
          className="block mb-3 rounded-xl bg-muted/20 p-3 hover:bg-muted/35 transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <Avatar className="h-9 w-9 ring-1 ring-border/20">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/8 text-primary font-semibold text-xs">
                {(displayName || "C")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-[0.8125rem] font-semibold truncate leading-snug">{displayName}</p>
              {profile.username && (
                <p className="text-[0.6875rem] text-muted-foreground/70">@{profile.username}</p>
              )}
            </div>
          </div>
        </Link>
      )}

      {/* Navigation */}
      <nav aria-label="Community navigation" className="space-y-0.5">
        {tabs.filter(t => !t.requiresAuth || user).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            title={!leftSidebarOpen ? tab.label : undefined}
            aria-label={tab.label}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.8125rem] font-medium transition-all duration-150 touch-manipulation",
              !leftSidebarOpen && "justify-center px-0",
              activeTab === tab.id
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30 active:scale-[0.98]"
            )}
          >
            <tab.icon className={cn("h-[17px] w-[17px] shrink-0", activeTab === tab.id && "text-primary")} />
            {leftSidebarOpen && <span className="truncate">{tab.label}</span>}
          </button>
        ))}
      </nav>

      {/* Profile completion */}
      {leftSidebarOpen && <div className="mt-3"><ProfileCompletionCard /></div>}

      {/* Stats */}
      {leftSidebarOpen && (
        <div className="mt-3 rounded-xl bg-muted/15 p-3">
          <OnlineCountBadge className="mb-2" />
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: isAr ? "عضو" : "Members", value: stats.members, color: "text-primary" },
              { label: isAr ? "منشور" : "Posts", value: stats.posts, color: "text-chart-2" },
              { label: isAr ? "مجموعة" : "Groups", value: stats.groups, color: "text-chart-3" },
              { label: isAr ? "وصفة" : "Recipes", value: stats.recipes, color: "text-chart-4" },
            ].map((stat, i) => (
              <div key={i} className="rounded-lg bg-card/50 p-2 text-center">
                <AnimatedCounter value={stat.value} className={cn("text-[0.8125rem] font-bold tabular-nums", stat.color)} />
                <p className="text-[0.625rem] text-muted-foreground/70 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
});
