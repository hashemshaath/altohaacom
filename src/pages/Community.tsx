import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { SEOHead } from "@/components/SEOHead";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAdTracking } from "@/hooks/useAdTracking";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { ChefsTab } from "@/components/community/ChefsTab";
import { GroupsTab } from "@/components/community/GroupsTab";
import { RecipesTab } from "@/components/community/RecipesTab";
import { EventsTab } from "@/components/community/EventsTab";
import { NetworkTab } from "@/components/community/NetworkTab";
import { LiveSessionsTab } from "@/components/community/LiveSessionsTab";
import { CommunityLeftSidebar, type CommunityTab } from "@/components/community/CommunityLeftSidebar";
import { CommunityRightSidebar } from "@/components/community/CommunityRightSidebar";
import { CommunityMobileTabs } from "@/components/community/CommunityMobileTabs";

export default function Community() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  useAdTracking();

  const [searchParams] = useSearchParams();
  const tagParam = searchParams.get("tag");
  const [activeTab, setActiveTab] = useState<CommunityTab>("feed");
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

  useEffect(() => {
    if (tagParam) setActiveTab("feed");
  }, [tagParam]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead
        title={isAr ? "مجتمع الطهاة | الطهاة" : "Culinary Community | Altohaa"}
        description={isAr ? "تواصل مع الطهاة وشارك الوصفات وانضم إلى المجموعات" : "Connect with chefs, share recipes, join groups on Altohaa."}
      />
      <Header />

      <main className="container flex-1">
        <div className="mx-auto max-w-[1200px] flex gap-0 lg:gap-2">
          <CommunityLeftSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            leftSidebarOpen={leftSidebarOpen}
            setLeftSidebarOpen={setLeftSidebarOpen}
          />

          <div className="flex-1 min-w-0 border-x border-border min-h-screen">
            <CommunityMobileTabs activeTab={activeTab} setActiveTab={setActiveTab} />

            {activeTab === "feed" && <CommunityFeed />}
            {activeTab === "chefs" && <div className="p-4"><ChefsTab /></div>}
            {activeTab === "recipes" && <div className="p-4"><RecipesTab /></div>}
            {activeTab === "groups" && <div className="p-4"><GroupsTab /></div>}
            {activeTab === "events" && <div className="p-4"><EventsTab /></div>}
            {activeTab === "live" && <div className="p-4"><LiveSessionsTab /></div>}
            {activeTab === "network" && user && <div className="p-4"><NetworkTab /></div>}
          </div>

          <CommunityRightSidebar
            rightSidebarOpen={rightSidebarOpen}
            setRightSidebarOpen={setRightSidebarOpen}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
