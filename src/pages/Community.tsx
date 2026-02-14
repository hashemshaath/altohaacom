import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
import { formatNumber } from "@/lib/formatNumber";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Newspaper, ChefHat, CalendarDays, UsersRound, UserPlus, Users, BookOpen,
  Search, TrendingUp, User, Sparkles, Hash,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type CommunityTab = "feed" | "chefs" | "recipes" | "groups" | "events" | "network";

export default function Community() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  useAdTracking();

  const [activeTab, setActiveTab] = useState<CommunityTab>("feed");
  const [stats, setStats] = useState({ members: 0, groups: 0, recipes: 0 });
  const [profile, setProfile] = useState<{ full_name: string; avatar_url: string | null; username: string | null } | null>(null);
  const [trendingTopics] = useState([
    { tag: isAr ? "مسابقات_الطهي" : "CookingCompetitions", count: 128 },
    { tag: isAr ? "وصفات_رمضان" : "RamadanRecipes", count: 96 },
    { tag: isAr ? "فن_الطهي" : "CulinaryArts", count: 74 },
    { tag: isAr ? "طهاة_العرب" : "ArabChefs", count: 52 },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      const [membersRes, groupsRes, recipesRes] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("groups").select("*", { count: "exact", head: true }),
        supabase.from("recipes").select("*", { count: "exact", head: true }).eq("is_published", true),
      ]);
      setStats({
        members: membersRes.count || 0,
        groups: groupsRes.count || 0,
        recipes: recipesRes.count || 0,
      });
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, avatar_url, username").eq("user_id", user.id).single().then(({ data }) => {
      if (data) setProfile(data);
    });
  }, [user]);

  const tabs: { id: CommunityTab; label: string; icon: any; requiresAuth?: boolean }[] = [
    { id: "feed", label: isAr ? "الخلاصة" : "Feed", icon: Newspaper },
    { id: "chefs", label: isAr ? "الطهاة" : "Chefs", icon: Users },
    { id: "recipes", label: isAr ? "الوصفات" : "Recipes", icon: BookOpen },
    { id: "groups", label: isAr ? "المجموعات" : "Groups", icon: UsersRound },
    { id: "events", label: isAr ? "الفعاليات" : "Events", icon: CalendarDays },
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
        <div className="mx-auto max-w-[1100px] flex gap-0 lg:gap-6">
          {/* Left Sidebar - Desktop only */}
          <aside className="hidden lg:block w-[260px] shrink-0 sticky top-[60px] self-start py-4">
            {/* Profile card */}
            {user && profile && (
              <Link to={`/${profile.username || user.id}`} className="block mb-4 rounded-2xl border border-border bg-card p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-primary/20">
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
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Stats */}
            <div className="mt-4 rounded-2xl border border-border bg-card p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                {isAr ? "إحصائيات" : "Stats"}
              </h3>
              <div className="space-y-2">
                {[
                  { label: isAr ? "عضو" : "Members", value: stats.members, color: "text-primary" },
                  { label: isAr ? "مجموعة" : "Groups", value: stats.groups, color: "text-chart-2" },
                  { label: isAr ? "وصفة" : "Recipes", value: stats.recipes, color: "text-chart-4" },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                    <span className={cn("text-sm font-bold", stat.color)}>{formatNumber(stat.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0 border-x border-border min-h-screen">
            {/* Mobile Tabs - Top horizontal scroll */}
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
            {activeTab === "network" && user && <div className="p-4"><NetworkTab /></div>}
          </div>

          {/* Right Sidebar - Desktop only */}
          <aside className="hidden xl:block w-[300px] shrink-0 sticky top-[60px] self-start py-4 space-y-4">
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
                  <div key={i} className="px-4 py-2.5 hover:bg-muted/30 transition-colors cursor-pointer">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Hash className="h-3 w-3" />
                      {isAr ? "رائج" : "Trending"}
                    </div>
                    <p className="text-sm font-bold mt-0.5">#{topic.tag}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatNumber(topic.count)} {isAr ? "منشور" : "posts"}
                    </p>
                  </div>
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
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
