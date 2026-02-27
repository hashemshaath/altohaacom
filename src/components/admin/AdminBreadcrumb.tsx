import { useLocation, Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const ROUTE_LABELS: Record<string, { en: string; ar: string }> = {
  "/admin": { en: "Dashboard", ar: "لوحة التحكم" },
  "/admin/analytics": { en: "Analytics", ar: "التحليلات" },
  "/admin/users": { en: "Users", ar: "المستخدمون" },
  "/admin/roles": { en: "Roles", ar: "الأدوار" },
  "/admin/verification": { en: "Verification", ar: "التوثيق" },
  "/admin/memberships": { en: "Memberships", ar: "العضويات" },
  "/admin/loyalty": { en: "Loyalty", ar: "الولاء" },
  "/admin/companies": { en: "Companies", ar: "الشركات" },
  "/admin/establishments": { en: "Establishments", ar: "المنشآت" },
  "/admin/crm": { en: "CRM", ar: "إدارة العلاقات" },
  "/admin/leads": { en: "Leads", ar: "العملاء المحتملون" },
  "/admin/competitions": { en: "Competitions", ar: "المسابقات" },
  "/admin/evaluation": { en: "Evaluation", ar: "التقييم" },
  "/admin/certificates": { en: "Certificates", ar: "الشهادات" },
  "/admin/exhibitions": { en: "Exhibitions", ar: "المعارض" },
  "/admin/global-events": { en: "Events", ar: "الفعاليات" },
  "/admin/chefs-table": { en: "Chef's Table", ar: "طاولة الشيف" },
  "/admin/articles": { en: "Articles", ar: "المقالات" },
  "/admin/knowledge": { en: "Knowledge", ar: "المعرفة" },
  "/admin/masterclasses": { en: "Masterclasses", ar: "الماستركلاس" },
  "/admin/media": { en: "Media", ar: "الوسائط" },
  "/admin/orders": { en: "Orders", ar: "الطلبات" },
  "/admin/invoices": { en: "Invoices", ar: "الفواتير" },
  "/admin/cost-center": { en: "Cost Center", ar: "مركز التكلفة" },
  "/admin/support-tickets": { en: "Support", ar: "الدعم" },
  "/admin/communications": { en: "Communications", ar: "التواصل" },
  "/admin/notifications": { en: "Notifications", ar: "الإشعارات" },
  "/admin/settings": { en: "Settings", ar: "الإعدادات" },
  "/admin/security": { en: "Security", ar: "الأمان" },
  "/admin/integrations": { en: "Integrations", ar: "التكاملات" },
  "/admin/audit": { en: "Audit Log", ar: "سجل المراجعة" },
  "/admin/database": { en: "Database", ar: "قاعدة البيانات" },
  "/admin/moderation": { en: "Moderation", ar: "المراجعة" },
  "/admin/advertising": { en: "Advertising", ar: "الإعلانات" },
  "/admin/templates": { en: "Templates", ar: "القوالب" },
  "/admin/marketing-automation": { en: "Marketing", ar: "التسويق" },
  "/admin/smart-import": { en: "Smart Import", ar: "استيراد ذكي" },
  "/admin/ai": { en: "AI Config", ar: "تهيئة الذكاء" },
  "/admin/localization": { en: "Localization", ar: "الترجمة" },
  "/admin/countries": { en: "Countries", ar: "الدول" },
  "/admin/qr-codes": { en: "QR Codes", ar: "رموز QR" },
  "/admin/mentorship": { en: "Mentorship", ar: "الإرشاد" },
  "/admin/audience-segments": { en: "Segments", ar: "الشرائح" },
  "/admin/live-chat": { en: "Live Chat", ar: "الدردشة المباشرة" },
  "/admin/chef-schedule": { en: "Chef Schedule", ar: "جدول الشيف" },
};

export function AdminBreadcrumb() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const location = useLocation();
  const pathname = location.pathname;

  // Don't show on root admin
  if (pathname === "/admin") return null;

  const currentLabel = ROUTE_LABELS[pathname];
  if (!currentLabel) return null;

  return (
    <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
      <Link to="/admin" className="hover:text-foreground transition-colors">
        {isAr ? "لوحة التحكم" : "Dashboard"}
      </Link>
      <ChevronRight className={cn("h-3 w-3", isAr && "rotate-180")} />
      <span className="text-foreground font-medium">
        {isAr ? currentLabel.ar : currentLabel.en}
      </span>
    </nav>
  );
}
