import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { PageShell } from "@/components/PageShell";
import { ProfileAnalyticsDashboard } from "@/components/profile/ProfileAnalyticsDashboard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function ProfileAnalytics() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <PageShell title={isAr ? "تحليلات الملف الشخصي" : "Profile Analytics"} className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/profile?tab=analytics"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">{isAr ? "تحليلات الملف الشخصي" : "Profile Analytics"}</h1>
      </div>
      {user && <ProfileAnalyticsDashboard userId={user.id} />}
    </PageShell>
  );
}
