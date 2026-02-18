import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { SEOHead } from "@/components/SEOHead";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/ads/AdBanner";
import { useAdTracking } from "@/hooks/useAdTracking";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { ChefsTab } from "@/components/community/ChefsTab";
import { GroupsTab } from "@/components/community/GroupsTab";
import { RecipesTab } from "@/components/community/RecipesTab";
import { EventsTab } from "@/components/community/EventsTab";
import { NetworkTab } from "@/components/community/NetworkTab";
import { LiveSessionsTab } from "@/components/community/LiveSessionsTab";
import { formatNumber } from "@/lib/formatNumber";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Newspaper, ChefHat, CalendarDays, UsersRound, UserPlus, Users, BookOpen,
  Search, TrendingUp, Hash, Activity, PanelLeftClose, PanelLeftOpen,
  PanelRightClose, PanelRightOpen, Radio,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type CommunityTab = "feed" | "chefs" | "recipes" | "groups" | "events" | "network" | "live";

const FALLBACK_TOPICS_EN = [
  { tag: "CookingCompetitions", count: 128 },
  { tag: "RamadanRecipes", count: 96 },
  { tag: "CulinaryArts", count: 74 },
  { tag: "ArabChefs", count: 52 },
];
const FALLBACK_TOPICS_AR = [
  { tag: "مسابقات_الطهي", count: 128 },
  { tag: "وصفات_رمضان", count: 96 },
  { tag: "فن_الطهي", count: 74 },
  { tag: "طهاة_العرب", count: 52 },
];

export default function Community() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  useAdTracking();

  const [searchParams] = useSearchParams();
  const tagParam = searchParams.get("tag");
  const [activeTab, setActiveTab] = useState<CommunityTab>("feed");
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

  // Auto-switch to feed tab when hashtag filter is active
  useEffect(() => {
    if (tagParam) setActiveTab("feed");
  }, [tagParam]);

  const { data: stats = { members: 0, groups: 0, recipes: 0, posts: 0 } } = useQuery({
    queryKey: ["community-stats"],
    queryFn: async () => {
      const [membersRes, groupsRes, recipesRes, postsRes] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("groups").select("*", { count: "exact", head: true }),
        supabase.from("recipes").select("*", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("posts").select("*", { count: "exact", head: true }).is("reply_to_post_id", null),
      ]);
      return {
        members: membersRes.count || 0,
        groups: groupsRes.count || 0,
        recipes: recipesRes.count || 0,
        posts: postsRes.count || 0,
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: trendingTopics = [] } = useQuery({
    queryKey: ["community-trending", isAr],
    queryFn: async () => {
      const { data: posts } = await supabase
        .from("posts")
        .select("content")
        .is("reply_to_post_id", null)
        .eq("moderation_status", "approved")
        .order("created_at", { ascending: false })
        .limit(200);

      if (!posts?.length) return isAr ? FALLBACK_TOPICS_AR : FALLBACK_TOPICS_EN;

      const tagCounts: Record<string, number> = {};
      posts.forEach((post) => {
        const matches = post.content?.match(/#([^\s#]+)/g);
        if (matches) {
          matches.forEach((m: string) => {
            const tag = m.replace("#", "");
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });

      const sorted = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([tag, count]) => ({ tag, count }));

      if (sorted.length < 4) {
        const fallbacks = isAr ? FALLBACK_TOPICS_AR : FALLBACK_TOPICS_EN;
        const existing = new Set(sorted.map((s) => s.tag));
        fallbacks.forEach((f) => {
          if (!existing.has(f.tag) && sorted.length < 6) sorted.push(f);
        });
      }

      return sorted;
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: profile } = useQuery({
    queryKey: ["community-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, username")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
    staleTime: 60000,
  });

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
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead
        title={isAr ? "مجتمع الطهاة | الطهاة" : "Culinary Community | Altohaa"}
        description={isAr ? "تواصل مع الطهاة وشارك الوصفات وانضم إلى المجموعات" : "Connect with chefs, share recipes, join groups on Altohaa."}
      />
      <Header />

      <main className="container flex-1">
        <div className="mx-auto max-w-[1200px] flex gap-0 lg:gap-2">
          {/* Left Sidebar - Desktop only */}
          <aside className={cn(
            "hidden lg:flex flex-col shrink-0 sticky top-[56px] self-start py-2 pe-1 transition-all duration-300 ease-in-out",
            leftSidebarOpen ? "w-[220px]" : "w-[48px]"
          )}>
            {/* Toggle button */}
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

            {/* Profile card */}
            {user && profile && leftSidebarOpen && (
              <Link to={`/${profile.username || user.id}`} className="block mb-2 rounded-xl border border-border bg-card p-3 hover:bg-muted/30 transition-colors group">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-primary/20 transition-transform group-hover:scale-105">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {(profile.full_name || "C")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{profile.full_name}</p>
                    {profile.username && (
                      <p className="text-xs text-muted-foreground">@{profile.username}</p>
                    )}
                  </div>
                </div>
              </Link>
            )}

            {/* Navigation */}
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

            {/* Stats */}
            {leftSidebarOpen && (
              <div className="mt-4 rounded-2xl border border-border bg-card p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                  {isAr ? "إحصائيات المجتمع" : "Community Stats"}
                </h3>
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

          {/* Main Content */}
          <div className="flex-1 min-w-0 border-x border-border min-h-screen">
            {/* Mobile Tabs */}
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

            {/* Tab Content */}
            {activeTab === "feed" && <CommunityFeed />}
            {activeTab === "chefs" && <div className="p-4"><ChefsTab /></div>}
            {activeTab === "recipes" && <div className="p-4"><RecipesTab /></div>}
            {activeTab === "groups" && <div className="p-4"><GroupsTab /></div>}
            {activeTab === "events" && <div className="p-4"><EventsTab /></div>}
            {activeTab === "live" && <div className="p-4"><LiveSessionsTab /></div>}
            {activeTab === "network" && user && <div className="p-4"><NetworkTab /></div>}
          </div>

          {/* Right Sidebar - Desktop only */}
          <aside className={cn(
            "hidden xl:flex flex-col shrink-0 sticky top-[56px] self-start py-2 ps-1 transition-all duration-300 ease-in-out",
            rightSidebarOpen ? "w-[260px]" : "w-[48px]"
          )}>
            {/* Toggle button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 mb-2 self-start rounded-full text-muted-foreground hover:text-foreground"
              onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            >
              {rightSidebarOpen
                ? (isAr ? <PanelLeftClose className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />)
                : (isAr ? <PanelLeftOpen className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />)
              }
            </Button>

            {rightSidebarOpen && (
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={isAr ? "بحث في المجتمع..." : "Search community..."}
                    className="ps-9 rounded-full bg-muted/50 border-0 focus-visible:ring-1"
                  />
                </div>

                {/* Trending */}
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                  <h3 className="px-4 pt-3 pb-2 text-base font-bold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    {isAr ? "الأكثر تداولاً" : "Trending"}
                  </h3>
                  <div className="divide-y divide-border">
                    {trendingTopics.map((topic, i) => (
                      <Link
                        key={i}
                        to={`/community?tag=${encodeURIComponent(topic.tag)}`}
                        className="block px-4 py-2.5 hover:bg-muted/30 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Hash className="h-3 w-3" />
                          <span>{isAr ? "رائج" : "Trending"}</span>
                          {i === 0 && <span className="ms-auto text-[9px] text-primary font-bold">{isAr ? "الأول" : "#1"}</span>}
                        </div>
                        <p className="text-sm font-bold mt-0.5 group-hover:text-primary transition-colors">#{topic.tag}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatNumber(topic.count)} {isAr ? "منشور" : "posts"}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Ad */}
                <AdBanner placementSlug="sidebar" className="rounded-2xl overflow-hidden" />

                {/* Footer links */}
                <div className="px-4">
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    {isAr ? "الشروط · الخصوصية · سياسة ملفات تعريف الارتباط · حول" : "Terms · Privacy · Cookie Policy · About"}
                    <br />
                    © {new Date().getFullYear()} Altohaa
                  </p>
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
