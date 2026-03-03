import { useLocation, Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { ChevronRight, LayoutDashboard } from "lucide-react";
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
  "/admin/organizers": { en: "Organizers", ar: "المنظمون" },
  "/admin/design": { en: "Design & Identity", ar: "التصميم والهوية" },
  "/admin/design/brand-identity": { en: "Brand Identity", ar: "الهوية البصرية" },
  "/admin/design/branding": { en: "Branding", ar: "العلامة التجارية" },
  "/admin/design/header-footer": { en: "Header & Footer", ar: "الرأس والتذييل" },
  "/admin/design/homepage": { en: "Homepage", ar: "الصفحة الرئيسية" },
  "/admin/design/covers": { en: "Covers & Themes", ar: "الأغلفة والمظهر" },
  "/admin/design/typography": { en: "Typography", ar: "الخطوط" },
  "/admin/design/layout": { en: "Layout & Spacing", ar: "التخطيط والتباعد" },
  "/admin/design/custom-css": { en: "Custom CSS", ar: "CSS مخصص" },
};

export function AdminBreadcrumb() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const location = useLocation();
  const pathname = location.pathname;

  if (pathname === "/admin") return null;

  // Handle nested design routes
  const isDesignSub = pathname.startsWith("/admin/design/");
  const parentLabel = isDesignSub ? ROUTE_LABELS["/admin/design"] : null;
  const currentLabel = ROUTE_LABELS[pathname];
  if (!currentLabel) return null;

  return (
    <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-5">
      <Link to="/admin" className="flex items-center gap-1.5 rounded-xl px-2 py-1 hover:bg-muted hover:text-foreground transition-all duration-200">
        <LayoutDashboard className="h-3 w-3" />
        <span>{isAr ? "لوحة التحكم" : "Dashboard"}</span>
      </Link>
      {parentLabel && (
        <>
          <ChevronRight className={cn("h-3 w-3 text-border", isAr && "rotate-180")} />
          <Link to="/admin/design" className="rounded-xl px-2 py-1 hover:bg-muted hover:text-foreground transition-all duration-200">
            {isAr ? parentLabel.ar : parentLabel.en}
          </Link>
        </>
      )}
      <ChevronRight className={cn("h-3 w-3 text-border", isAr && "rotate-180")} />
      <span className="rounded-xl bg-primary/8 px-2.5 py-1 text-primary font-semibold">
        {isAr ? currentLabel.ar : currentLabel.en}
      </span>
    </nav>
  );
}
