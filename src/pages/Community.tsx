import { useLanguage } from "@/i18n/LanguageContext";
import { SEOHead } from "@/components/SEOHead";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FeedTab } from "@/components/community/FeedTab";
import { ChefsTab } from "@/components/community/ChefsTab";
import { GroupsTab } from "@/components/community/GroupsTab";
import { RecipesTab } from "@/components/community/RecipesTab";
import { EventsTab } from "@/components/community/EventsTab";
import { Users, Newspaper, ChefHat, CalendarDays, UsersRound, Globe, MessageCircle } from "lucide-react";

export default function Community() {
  const { t, language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead
        title="Culinary Community"
        description="Connect with chefs, share recipes, join groups, and engage with the culinary community on Altohaa."
      />
      <Header />

      {/* Hero Banner */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="absolute -top-32 start-1/4 h-64 w-64 rounded-full bg-primary/8 blur-[100px] animate-pulse" />
        <div className="absolute -top-20 end-1/3 h-48 w-48 rounded-full bg-accent/10 blur-[80px] animate-pulse [animation-delay:1s]" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        <div className="container relative py-10 md:py-14">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15 shadow-sm">
              <UsersRound className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold md:text-3xl lg:text-4xl">
                {t("community")}
              </h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground sm:text-base">
                {isAr
                  ? "تواصل مع الطهاة وشارك وصفاتك وانضم إلى المجموعات"
                  : "Connect with chefs, share recipes, and join culinary groups"}
              </p>
            </div>
          </div>

          {/* Quick stat pills */}
          <div className="mt-6 flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-xs">
              <Newspaper className="h-3 w-3" />
              {isAr ? "المنشورات" : "Feed"}
            </Badge>
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-xs">
              <ChefHat className="h-3 w-3" />
              {isAr ? "الوصفات" : "Recipes"}
            </Badge>
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-xs">
              <UsersRound className="h-3 w-3" />
              {isAr ? "المجموعات" : "Groups"}
            </Badge>
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-xs">
              <Globe className="h-3 w-3" />
              {isAr ? "مجتمع عالمي" : "Global Community"}
            </Badge>
          </div>
        </div>
      </section>

      <main className="container flex-1 py-6 md:py-8">
        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="mb-6 h-auto w-full justify-start gap-1 overflow-x-auto overflow-y-hidden whitespace-nowrap rounded-lg border border-border/50 bg-muted/30 p-1">
            <TabsTrigger value="feed" className="gap-1.5 rounded-md text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm">
              <Newspaper className="h-3.5 w-3.5" />
              {t("feed")}
            </TabsTrigger>
            <TabsTrigger value="recipes" className="gap-1.5 rounded-md text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm">
              <ChefHat className="h-3.5 w-3.5" />
              {isAr ? "الوصفات" : "Recipes"}
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-1.5 rounded-md text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm">
              <CalendarDays className="h-3.5 w-3.5" />
              {isAr ? "الفعاليات" : "Events"}
            </TabsTrigger>
            <TabsTrigger value="chefs" className="gap-1.5 rounded-md text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm">
              <Users className="h-3.5 w-3.5" />
              {t("chefs")}
            </TabsTrigger>
            <TabsTrigger value="groups" className="gap-1.5 rounded-md text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm">
              <UsersRound className="h-3.5 w-3.5" />
              {t("groups")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed"><FeedTab /></TabsContent>
          <TabsContent value="recipes"><RecipesTab /></TabsContent>
          <TabsContent value="events"><EventsTab /></TabsContent>
          <TabsContent value="chefs"><ChefsTab /></TabsContent>
          <TabsContent value="groups"><GroupsTab /></TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
