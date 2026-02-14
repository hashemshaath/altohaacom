import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AdBanner } from "@/components/ads/AdBanner";
import { useAdTracking } from "@/hooks/useAdTracking";
import { SEOHead } from "@/components/SEOHead";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeedTab } from "@/components/community/FeedTab";
import { ChefsTab } from "@/components/community/ChefsTab";
import { GroupsTab } from "@/components/community/GroupsTab";
import { RecipesTab } from "@/components/community/RecipesTab";
import { EventsTab } from "@/components/community/EventsTab";
import { NetworkTab } from "@/components/community/NetworkTab";
import { Newspaper, ChefHat, CalendarDays, UsersRound, UserPlus, Users, BookOpen } from "lucide-react";

export default function Community() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  useAdTracking();

  const [stats, setStats] = useState({ members: 0, groups: 0, recipes: 0 });

  useEffect(() => {
    const fetchStats = async () => {
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
    fetchStats();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead
        title="Culinary Community"
        description="Connect with chefs, share recipes, join groups, and engage with the culinary community on Altohaa."
      />
      <Header />

      {/* Compact Hero */}
      <section className="border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="container py-6 md:py-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15">
                <UsersRound className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-xl font-bold md:text-2xl">
                  {t("community")}
                </h1>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {isAr
                    ? "تواصل مع الطهاة وشارك وصفاتك وانضم إلى المجموعات"
                    : "Connect with chefs, share recipes, and join culinary groups"}
                </p>
              </div>
            </div>

            {/* Live Stats */}
            <div className="hidden items-center gap-4 sm:flex">
              <div className="text-center">
                <p className="text-lg font-bold text-primary">{stats.members.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">{isAr ? "عضو" : "Members"}</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-lg font-bold text-chart-2">{stats.groups.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">{isAr ? "مجموعة" : "Groups"}</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-lg font-bold text-chart-4">{stats.recipes.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">{isAr ? "وصفة" : "Recipes"}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="container flex-1 py-4 md:py-6">
        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="mb-5 h-auto w-full justify-start gap-0.5 overflow-x-auto overflow-y-hidden whitespace-nowrap rounded-xl border border-border/40 bg-muted/20 p-1">
            <TabsTrigger value="feed" className="gap-1.5 rounded-lg px-3 py-2 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm">
              <Newspaper className="h-3.5 w-3.5" />
              {isAr ? "المنشورات" : "Feed"}
            </TabsTrigger>
            <TabsTrigger value="chefs" className="gap-1.5 rounded-lg px-3 py-2 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm">
              <Users className="h-3.5 w-3.5" />
              {isAr ? "الطهاة" : "Chefs"}
            </TabsTrigger>
            <TabsTrigger value="recipes" className="gap-1.5 rounded-lg px-3 py-2 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm">
              <BookOpen className="h-3.5 w-3.5" />
              {isAr ? "الوصفات" : "Recipes"}
            </TabsTrigger>
            <TabsTrigger value="groups" className="gap-1.5 rounded-lg px-3 py-2 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm">
              <UsersRound className="h-3.5 w-3.5" />
              {isAr ? "المجموعات" : "Groups"}
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-1.5 rounded-lg px-3 py-2 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm">
              <CalendarDays className="h-3.5 w-3.5" />
              {isAr ? "الفعاليات" : "Events"}
            </TabsTrigger>
            {user && (
              <TabsTrigger value="network" className="gap-1.5 rounded-lg px-3 py-2 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm">
                <UserPlus className="h-3.5 w-3.5" />
                {isAr ? "شبكتي" : "My Network"}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="feed"><FeedTab /></TabsContent>
          <TabsContent value="chefs"><ChefsTab /></TabsContent>
          <TabsContent value="recipes"><RecipesTab /></TabsContent>
          <TabsContent value="groups"><GroupsTab /></TabsContent>
          <TabsContent value="events"><EventsTab /></TabsContent>
          {user && <TabsContent value="network"><NetworkTab /></TabsContent>}
        </Tabs>

        <div className="mt-6">
          <AdBanner placementSlug="in-feed" className="w-full max-w-2xl mx-auto aspect-[3/1]" />
        </div>
      </main>
      <Footer />
    </div>
  );
}
