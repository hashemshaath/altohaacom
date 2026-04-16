import { useIsAr } from "@/hooks/useIsAr";
import { useAuth } from "@/contexts/AuthContext";
import { PageShell } from "@/components/PageShell";
import { ProfileAnalyticsDashboard } from "@/components/profile/ProfileAnalyticsDashboard";
import { PersonalAnalyticsDashboard } from "@/components/analytics/PersonalAnalyticsDashboard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Eye, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

export default function ProfileAnalytics() {
  const { user } = useAuth();
  const isAr = useIsAr();

  return (
    <PageShell title={isAr ? "التحليلات المتقدمة" : "Advanced Analytics"} className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/profile?tab=analytics"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">{isAr ? "التحليلات المتقدمة" : "Advanced Analytics"}</h1>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="personal" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            {isAr ? "نشاطي" : "My Activity"}
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            {isAr ? "زيارات الملف" : "Profile Views"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <PersonalAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="profile">
          {user && <ProfileAnalyticsDashboard userId={user.id} />}
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
