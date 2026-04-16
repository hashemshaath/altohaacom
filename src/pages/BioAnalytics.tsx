import { useIsAr } from "@/hooks/useIsAr";
import { useAuth } from "@/contexts/AuthContext";
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

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

export default function BioAnalytics() {
  const { user } = useAuth();
  const isAr = useIsAr();

  const { data: page, isLoading } = useQuery({
    queryKey: ["bio-page-for-analytics", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("social_link_pages")
        .select("id, page_title")
        .eq("user_id", user!.id)
        .limit(1)
        .maybeSingle();
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
