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
import { formatNumber } from "@/lib/formatNumber";
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
        title={isAr ? "مجتمع الطهاة" : "Culinary Community"}
        description={isAr ? "تواصل مع الطهاة وشارك الوصفات وانضم إلى المجموعات" : "Connect with chefs, share recipes, join groups, and engage with the culinary community on Altohaa."}
      />
      <Header />

      {/* Compact Hero */}
      <section className="border-b border-border/40 bg-gradient-to-b from-primary/5 to-background">
        <div className="container py-8 md:py-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 ring-1 ring-primary/20">
                <div className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  {isAr ? "مجتمع الطهاة" : "Chef Community"}
                </span>
              </div>
              <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">
                {isAr ? "المجتمع" : "Community"}
              </h1>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                {isAr
                  ? "تواصل مع الطهاة، شارك الوصفات، وابنِ شبكتك المهنية."
                  : "Connect with chefs, share recipes, and build your professional network."}
              </p>
            </div>

            {/* Compact Stats */}
            <div className="flex gap-4 md:gap-6">
              {[
                { label: isAr ? "عضو" : "Members", value: stats.members, color: "text-primary" },
                { label: isAr ? "مجموعة" : "Groups", value: stats.groups, color: "text-chart-2" },
                { label: isAr ? "وصفة" : "Recipes", value: stats.recipes, color: "text-chart-4" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className={`text-xl font-bold ${stat.color} md:text-2xl`}>
                    {formatNumber(stat.value)}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="container flex-1 py-4 md:py-6">
        <Tabs defaultValue="feed" className="w-full">
          <div className="sticky top-[56px] z-40 -mx-4 border-b border-border/40 bg-background/80 px-4 py-3 backdrop-blur-md md:mx-0 md:rounded-2xl md:border md:px-4 md:shadow-sm">
            <TabsList className="h-auto w-full justify-start gap-1.5 overflow-x-auto bg-transparent p-0">
              {[
                { id: "feed", label: isAr ? "المنشورات" : "Feed", icon: Newspaper },
                { id: "chefs", label: isAr ? "الطهاة" : "Chefs", icon: Users },
                { id: "recipes", label: isAr ? "الوصفات" : "Recipes", icon: BookOpen },
                { id: "groups", label: isAr ? "المجموعات" : "Groups", icon: UsersRound },
                { id: "events", label: isAr ? "الفعاليات" : "Events", icon: CalendarDays },
                ...(user ? [{ id: "network", label: isAr ? "شبكتي" : "My Network", icon: UserPlus }] : [])
              ].map((tab) => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id} 
                  className="gap-2 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg shadow-primary/20"
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

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
