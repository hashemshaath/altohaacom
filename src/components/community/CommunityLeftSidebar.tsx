import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatNumber } from "@/lib/formatNumber";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Newspaper, ChefHat, CalendarDays, UsersRound, UserPlus, Users, BookOpen,
  Activity, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Radio, Bookmark,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { OnlineCountBadge } from "./PresenceIndicator";
import { ProfileCompletionCard } from "@/components/onboarding/ProfileCompletionCard";

export type CommunityTab = "feed" | "chefs" | "recipes" | "groups" | "events" | "network" | "live" | "bookmarks";

interface CommunityLeftSidebarProps {
  activeTab: CommunityTab;
  setActiveTab: (tab: CommunityTab) => void;
  leftSidebarOpen: boolean;
  setLeftSidebarOpen: (open: boolean) => void;
}

export function CommunityLeftSidebar({ activeTab, setActiveTab, leftSidebarOpen, setLeftSidebarOpen }: CommunityLeftSidebarProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: profile } = useQuery({
    queryKey: ["community-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, full_name_ar, display_name, display_name_ar, avatar_url, username")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
    staleTime: 60000,
  });

  const { data: stats = { members: 0, groups: 0, recipes: 0, posts: 0 } } = useQuery({
    queryKey: ["community-stats"],
    queryFn: async () => {
      const [membersRes, groupsRes, recipesRes, postsRes] = await Promise.all([
        supabase.from("profiles").select("id"),
        supabase.from("groups").select("id"),
        supabase.from("recipes").select("id").eq("is_published", true),
        supabase.from("posts").select("id").is("reply_to_post_id", null),
      ]);
      return {
        members: membersRes.data?.length || 0,
        groups: groupsRes.data?.length || 0,
        recipes: recipesRes.data?.length || 0,
        posts: postsRes.data?.length || 0,
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  const tabs: { id: CommunityTab; label: string; icon: any; requiresAuth?: boolean }[] = [
    { id: "feed", label: isAr ? "الرئيسية" : "Feed", icon: Newspaper },
    { id: "chefs", label: isAr ? "الطهاة" : "Chefs", icon: Users },
    { id: "recipes", label: isAr ? "الوصفات" : "Recipes", icon: BookOpen },
    { id: "groups", label: isAr ? "المجموعات" : "Groups", icon: UsersRound },
    { id: "events", label: isAr ? "الفعاليات" : "Events", icon: CalendarDays },
    { id: "live", label: isAr ? "جلسات مباشرة" : "Live Sessions", icon: Radio },
    { id: "bookmarks", label: isAr ? "المحفوظات" : "Bookmarks", icon: Bookmark, requiresAuth: true },
    { id: "network", label: isAr ? "شبكتي" : "My Network", icon: UserPlus, requiresAuth: true },
  ];

  return (
    <aside className={cn(
      "hidden lg:flex flex-col shrink-0 sticky top-12 self-start py-2 pe-1 transition-all duration-300 ease-in-out",
      leftSidebarOpen ? "w-[220px]" : "w-[48px]"
    )}>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 mb-2 self-end rounded-full text-muted-foreground hover:text-foreground"
        onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
      >
        {leftSidebarOpen
          ? (isAr ? <PanelRightClose className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />)
          : (isAr ? <PanelRightOpen className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />)
        }
      </Button>

      {user && profile && leftSidebarOpen && (
        <Link to={`/${profile.username || user.id}`} className="block mb-2 rounded-xl border border-border bg-card p-3 hover:bg-muted/30 transition-colors group">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20 transition-transform group-hover:scale-105">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {((isAr ? (profile.display_name_ar || profile.display_name) : profile.display_name) || profile.full_name || "C")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{(isAr ? (profile.display_name_ar || profile.display_name) : profile.display_name) || profile.full_name}</p>
              {profile.username && (
                <p className="text-xs text-muted-foreground">@{profile.username}</p>
              )}
            </div>
          </div>
        </Link>
      )}

      <nav className="space-y-0.5">
        {tabs.filter(t => !t.requiresAuth || user).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            title={!leftSidebarOpen ? tab.label : undefined}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              !leftSidebarOpen && "justify-center px-0",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "text-foreground hover:bg-muted active:scale-[0.98]"
            )}
          >
            <tab.icon className="h-5 w-5 shrink-0" />
            {leftSidebarOpen && tab.label}
          </button>
        ))}
      </nav>

      {leftSidebarOpen && <ProfileCompletionCard />}

      {leftSidebarOpen && (
        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-primary" />
            {isAr ? "إحصائيات المجتمع" : "Community Stats"}
          </h3>
          <OnlineCountBadge className="mb-2.5" />
          <div className="space-y-2.5">
            {[
              { label: isAr ? "عضو" : "Members", value: stats.members, color: "text-primary" },
              { label: isAr ? "منشور" : "Posts", value: stats.posts, color: "text-chart-2" },
              { label: isAr ? "مجموعة" : "Groups", value: stats.groups, color: "text-chart-3" },
              { label: isAr ? "وصفة" : "Recipes", value: stats.recipes, color: "text-chart-4" },
            ].map((stat, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <span className={cn("text-sm font-bold tabular-nums", stat.color)}>{formatNumber(stat.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
