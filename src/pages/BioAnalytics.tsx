import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { BioAnalyticsDashboard } from "@/components/social-links/BioAnalyticsDashboard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function BioAnalytics() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: page, isLoading } = useQuery({
    queryKey: ["bio-page-for-analytics", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("social_link_pages")
        .select("id, page_title")
        .eq("user_id", user!.id)
        .limit(1)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  return (
    <>
      <SEOHead title={isAr ? "تحليلات صفحة Bio" : "Bio Page Analytics"} />
      <Header />
      <main className="container max-w-5xl mx-auto py-8 px-4 min-h-screen">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/social-links"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-2xl font-bold">{isAr ? "تحليلات صفحة Bio" : "Bio Page Analytics"}</h1>
        </div>
        {isLoading && <Skeleton className="h-64 w-full" />}
        {page && <BioAnalyticsDashboard pageId={page.id} />}
        {!isLoading && !page && (
          <p className="text-muted-foreground text-center py-12">
            {isAr ? "لم يتم العثور على صفحة Bio" : "No bio page found"}
          </p>
        )}
      </main>
      <Footer />
    </>
  );
}
