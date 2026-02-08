import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeedTab } from "@/components/community/FeedTab";
import { ChefsTab } from "@/components/community/ChefsTab";
import { GroupsTab } from "@/components/community/GroupsTab";

export default function Community() {
  const { t } = useLanguage();
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container flex-1 py-8">
        <h1 className="mb-6 font-serif text-3xl font-bold">{t("community")}</h1>
        
        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="feed">{t("feed")}</TabsTrigger>
            <TabsTrigger value="chefs">{t("chefs")}</TabsTrigger>
            <TabsTrigger value="groups">{t("groups")}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="feed">
            <FeedTab />
          </TabsContent>
          
          <TabsContent value="chefs">
            <ChefsTab />
          </TabsContent>
          
          <TabsContent value="groups">
            <GroupsTab />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
