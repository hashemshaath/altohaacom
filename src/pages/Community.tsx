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

export default function Community() {
  const { t, language } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="Culinary Community"
        description="Connect with chefs, share recipes, join groups, and engage with the culinary community on Altohaa."
      />
      <Header />
      <main className="container flex-1 py-8">
        <h1 className="mb-6 font-serif text-3xl font-bold">{t("community")}</h1>
        
        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="mb-6 h-auto w-full justify-start overflow-x-auto overflow-y-hidden whitespace-nowrap">
            <TabsTrigger value="feed">{t("feed")}</TabsTrigger>
            <TabsTrigger value="recipes">{language === "ar" ? "الوصفات" : "Recipes"}</TabsTrigger>
            <TabsTrigger value="events">{language === "ar" ? "الفعاليات" : "Events"}</TabsTrigger>
            <TabsTrigger value="chefs">{t("chefs")}</TabsTrigger>
            <TabsTrigger value="groups">{t("groups")}</TabsTrigger>
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
