import AdminPageHeader from "@/components/admin/AdminPageHeader";
import SecurityDashboard from "@/components/admin/SecurityDashboard";
import { SecurityOverviewWidget } from "@/components/admin/SecurityOverviewWidget";
import { SecurityAuditWidget } from "@/components/admin/SecurityAuditWidget";
import { SecurityLiveWidget } from "@/components/admin/SecurityLiveWidget";
import { AuditLiveStatsWidget } from "@/components/admin/AuditLiveStatsWidget";
import { SessionMonitorWidget } from "@/components/admin/SessionMonitorWidget";
import { RolePermissionsOverview } from "@/components/admin/RolePermissionsOverview";
import { ShieldAlert } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { ActivityPulse } from "@/components/ui/activity-pulse";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";

export default function SecurityAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={ShieldAlert}
        title={isAr ? "مركز الأمان والحماية" : "Security Center"}
        description={isAr ? "مراقبة الأحداث الأمنية والجلسات والصلاحيات" : "Monitor security events, sessions, and permissions"}
        actions={
          <div className="flex items-center gap-3">
            <ActivityPulse status="live" label={isAr ? "مراقبة مباشرة" : "Live monitoring"} size="md" />
            <ConfidenceBadge level="verified" label={isAr ? "محمي" : "Protected"} />
          </div>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <RolePermissionsOverview />
          <SessionMonitorWidget />
        </div>
        <div className="space-y-4">
          <AuditLiveStatsWidget />
          <SecurityLiveWidget />
        </div>
      </div>
      <SecurityAuditWidget />
      <SecurityOverviewWidget />
      <SecurityDashboard />
    </div>
  );
}
