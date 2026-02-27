import AdminPageHeader from "@/components/admin/AdminPageHeader";
import SecurityDashboard from "@/components/admin/SecurityDashboard";
import { SecurityOverviewWidget } from "@/components/admin/SecurityOverviewWidget";
import { SecurityAuditWidget } from "@/components/admin/SecurityAuditWidget";
import { ShieldAlert } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

export default function SecurityAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={ShieldAlert}
        title={isAr ? "مركز الأمان والحماية" : "Security Center"}
        description={isAr ? "مراقبة الأحداث الأمنية والجلسات والصلاحيات" : "Monitor security events, sessions, and permissions"}
      />
      <SecurityAuditWidget />
      <SecurityOverviewWidget />
      <SecurityDashboard />
    </div>
  );
}
