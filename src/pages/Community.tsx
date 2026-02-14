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

      {/* Premium Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-5 grayscale" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        
        <div className="absolute -top-32 start-1/4 h-64 w-64 rounded-full bg-primary/10 blur-[100px] animate-pulse" />
        <div className="absolute -bottom-32 end-1/4 h-64 w-64 rounded-full bg-accent/10 blur-[100px] animate-pulse [animation-delay:1.5s]" />

        <div className="container relative py-12 md:py-16">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 ring-1 ring-primary/20 backdrop-blur-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  {isAr ? "مجتمع الطهاة العالمي" : "Global Chef Community"}
                </span>
              </div>
              
              <div className="space-y-4 text-center md:text-start">
                <h1 className="font-serif text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-balance leading-[1.1]">
                  {isAr ? (
                    <>تواصل، شارك، <span className="text-primary italic">وتألق</span></>
                  ) : (
                    <>Connect, Share, & <span className="text-primary italic">Thrive</span></>
                  )}
                </h1>
                <p className="max-w-xl text-base text-muted-foreground/90 md:text-lg leading-relaxed">
                  {isAr
                    ? "انضم إلى نخبة الطهاة، شارك أسرار مهنتك، وابنِ شبكتك المهنية في أكبر تجمع لعشاق فنون الطهي"
                    : "Join elite culinary professionals, share craft secrets, and build your professional network in the world's most focused gastronomy hub"}
                </p>
              </div>
            </div>

            {/* Live Stats Glass Cards */}
            <div className="grid grid-cols-3 gap-3 md:gap-4 lg:grid-cols-1">
              {[
                { label: isAr ? "عضو" : "Members", value: stats.members, color: "text-primary", bg: "bg-primary/5" },
                { label: isAr ? "مجموعة" : "Groups", value: stats.groups, color: "text-chart-2", bg: "bg-chart-2/5" },
                { label: isAr ? "وصفة" : "Recipes", value: stats.recipes, color: "text-chart-4", bg: "bg-chart-4/5" }
              ].map((stat, i) => (
                <div 
                  key={i} 
                  className={`flex flex-col items-center justify-center rounded-[2rem] border border-border/40 ${stat.bg} p-4 text-center backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 md:p-6 lg:flex-row lg:justify-start lg:gap-6 lg:px-10 lg:py-5`}
                >
                  <div className={`text-2xl font-bold tracking-tighter ${stat.color} md:text-3xl lg:text-4xl`}>
                    {stat.value.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground md:text-xs">
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
          <div className="sticky top-[64px] z-40 -mx-4 border-b border-border/40 bg-background/80 px-4 py-3 backdrop-blur-md md:mx-0 md:rounded-2xl md:border md:px-4 md:shadow-sm">
            <TabsList className="h-auto w-full justify-start gap-1.5 overflow-x-auto bg-transparent p-0">
              {[
                { id: "feed", label: isAr ? "المنشورات" : "Feed", icon: Newspaper },
                { id: "chefs", label: isAr ? "الطهاة" : "Chefs", icon: Users },
                { id: "recipes", label: isAr ? "الوصفات" : "Recipes", icon: BookOpen },
                { id: "groups", label: isAr ? "المجموعات" : "Groups", icon: UsersRound },
                { id: "events", label: isAr ? "الفعاليات" : "Events", icon: CalendarDays },
                ...(user ? [{ id: "network", label: isAr ? "شبكتي" : "My Network", icon: UserPlus }] : [])
              ].map((t) => (
                <TabsTrigger 
                  key={t.id} 
                  value={t.id} 
                  className="gap-2 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg shadow-primary/20"
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
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
