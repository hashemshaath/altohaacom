import { useLanguage } from "@/i18n/LanguageContext";
import { SEOHead } from "@/components/SEOHead";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeedTab } from "@/components/community/FeedTab";
import { ChefsTab } from "@/components/community/ChefsTab";
import { GroupsTab } from "@/components/community/GroupsTab";
import { RecipesTab } from "@/components/community/RecipesTab";
import { EventsTab } from "@/components/community/EventsTab";
import { Users, Newspaper, ChefHat, CalendarDays, UsersRound } from "lucide-react";

export default function Community() {
  const { t, language } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="Culinary Community"
        description="Connect with chefs, share recipes, join groups, and engage with the culinary community on Altohaa."
      />
      <Header />
      <main className="container flex-1 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <UsersRound className="h-4 w-4 text-primary" />
            </div>
            <h1 className="font-serif text-2xl font-bold md:text-3xl">{t("community")}</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            {language === "ar"
              ? "تواصل مع الطهاة وشارك وصفاتك وانضم إلى المجموعات"
              : "Connect with chefs, share recipes, and join culinary groups"}
          </p>
        </div>

        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="mb-6 h-auto w-full justify-start gap-1 overflow-x-auto overflow-y-hidden whitespace-nowrap bg-muted/50 p-1">
            <TabsTrigger value="feed" className="gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm">
              <Newspaper className="h-3.5 w-3.5" />
              {t("feed")}
            </TabsTrigger>
            <TabsTrigger value="recipes" className="gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm">
              <ChefHat className="h-3.5 w-3.5" />
              {language === "ar" ? "الوصفات" : "Recipes"}
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm">
              <CalendarDays className="h-3.5 w-3.5" />
              {language === "ar" ? "الفعاليات" : "Events"}
            </TabsTrigger>
            <TabsTrigger value="chefs" className="gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm">
              <Users className="h-3.5 w-3.5" />
              {t("chefs")}
            </TabsTrigger>
            <TabsTrigger value="groups" className="gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm">
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
