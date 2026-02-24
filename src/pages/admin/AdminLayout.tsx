import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import AdminPendingBanner from "@/components/admin/AdminPendingBanner";
import { Outlet, NavLink } from "react-router-dom";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { cn } from "@/lib/utils";
import { GraduationCap, BarChart3, Landmark, Building2, MessageSquare as MessageSquareIcon, Earth, QrCode, UtensilsCrossed, MailOpen, HandHeart, ShieldCheck, ShieldAlert, Ticket, Target, Headphones, Activity, Megaphone, Languages, Package, ChefHat, ClipboardCheck, Calculator, Calendar, Crown, MessageCircle, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Users,
  Shield,
  CreditCard,
  Flag,
  FileText,
  LayoutDashboard,
  UserSearch,
  Trophy,
  Settings,
  
  Plug,
  Bot,
  Sparkles,
  Newspaper,
  Image,
  Eye,
  ChevronLeft,
  ChevronRight,
  Building,
  Bell,
  Globe,
  Database,
  Award,
  BookOpen,
  Menu,
} from "lucide-react";

export default function AdminLayout() {
  const { t, language } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navSections = [
    {
      title: language === "ar" ? "لوحة التحكم" : "Dashboard",
      items: [
        { to: "/admin", icon: LayoutDashboard, label: language === "ar" ? "نظرة عامة" : "Overview", end: true },
        { to: "/admin/analytics", icon: BarChart3, label: language === "ar" ? "التحليلات" : "Analytics" },
      ],
    },
    {
      title: language === "ar" ? "المستخدمين والجهات" : "Users & Organizations",
      items: [
        { to: "/admin/users", icon: Users, label: language === "ar" ? "المستخدمين" : "Users" },
        { to: "/admin/roles", icon: Shield, label: language === "ar" ? "الأدوار والصلاحيات" : "Roles & Permissions" },
        { to: "/admin/verification", icon: ShieldCheck, label: language === "ar" ? "التوثيق والتحقق" : "Verification" },
        { to: "/admin/memberships", icon: CreditCard, label: language === "ar" ? "العضويات" : "Memberships" },
        { to: "/admin/loyalty", icon: Crown, label: language === "ar" ? "الولاء والمكافآت" : "Loyalty & Rewards" },
        { to: "/admin/companies", icon: Building, label: language === "ar" ? "الشركات والرعاة" : "Companies & Sponsors" },
        { to: "/admin/entities", icon: Building2, label: language === "ar" ? "الجهات والجمعيات" : "Entities Registry" },
        { to: "/admin/establishments", icon: Building, label: language === "ar" ? "المنشآت" : "Establishments" },
      ],
    },
    {
      title: language === "ar" ? "المسابقات والفعاليات" : "Competitions & Events",
      items: [
        { to: "/admin/competitions", icon: Trophy, label: language === "ar" ? "المسابقات" : "Competitions" },
        { to: "/admin/evaluation", icon: ClipboardCheck, label: language === "ar" ? "مركز التقييم" : "Evaluation Center" },
        { to: "/admin/certificates", icon: Award, label: language === "ar" ? "الشهادات" : "Certificates" },
        { to: "/admin/exhibitions", icon: Landmark, label: language === "ar" ? "المعارض والفعاليات" : "Exhibitions & Events" },
        { to: "/admin/global-events", icon: Earth, label: language === "ar" ? "التقويم العالمي" : "Global Events" },
        { to: "/admin/chefs-table", icon: ChefHat, label: language === "ar" ? "طاولة الشيف" : "Chef's Table" },
        { to: "/admin/chef-schedule", icon: Calendar, label: language === "ar" ? "جداول الطهاة" : "Chef Schedules" },
      ],
    },
    {
      title: language === "ar" ? "المحتوى والوسائط" : "Content & Media",
      items: [
        { to: "/admin/articles", icon: Newspaper, label: language === "ar" ? "المقالات والأخبار" : "Articles & News" },
        { to: "/admin/knowledge", icon: BookOpen, label: language === "ar" ? "بوابة المعرفة" : "Knowledge Portal" },
        { to: "/admin/masterclasses", icon: GraduationCap, label: language === "ar" ? "الدورات التعليمية" : "Masterclasses" },
        { to: "/admin/mentorship", icon: HandHeart, label: language === "ar" ? "الإرشاد" : "Mentorship" },
        { to: "/admin/media", icon: Image, label: language === "ar" ? "مكتبة الوسائط" : "Media Library" },
        { to: "/admin/qr-codes", icon: QrCode, label: language === "ar" ? "رموز QR" : "QR Codes" },
        { to: "/admin/moderation", icon: Flag, label: language === "ar" ? "إدارة المحتوى" : "Moderation" },
        { to: "/admin/advertising", icon: Megaphone, label: language === "ar" ? "مركز الإعلانات" : "Advertising" },
      ],
    },
    {
      title: language === "ar" ? "المالية والعمليات" : "Finance & Operations",
      items: [
        { to: "/admin/orders", icon: CreditCard, label: language === "ar" ? "الطلبات" : "Orders" },
        { to: "/admin/order-center", icon: Package, label: language === "ar" ? "مركز الطلبات" : "Order Center" },
        { to: "/admin/invoices", icon: FileText, label: language === "ar" ? "الفواتير" : "Invoices" },
        { to: "/admin/invoice-customization", icon: FileText, label: language === "ar" ? "تخصيص الفواتير" : "Invoice Settings" },
        { to: "/admin/cost-center", icon: Calculator, label: language === "ar" ? "مركز التكلفة" : "Cost Center" },
      ],
    },
    {
      title: language === "ar" ? "الدعم والتواصل" : "Support & Communications",
      items: [
        { to: "/admin/support-tickets", icon: Ticket, label: language === "ar" ? "تذاكر الدعم" : "Support Tickets" },
        { to: "/admin/live-chat", icon: Headphones, label: language === "ar" ? "الدعم المباشر" : "Live Support" },
        { to: "/admin/communications", icon: MessageSquareIcon, label: language === "ar" ? "صندوق التواصل" : "Communications" },
        { to: "/admin/templates", icon: MailOpen, label: language === "ar" ? "قوالب الاتصالات" : "Templates" },
        { to: "/admin/notifications", icon: Bell, label: language === "ar" ? "الإشعارات" : "Notifications" },
        { to: "/admin/marketing-automation", icon: Megaphone, label: language === "ar" ? "أتمتة التسويق" : "Marketing Automation" },
      ],
    },
    {
      title: language === "ar" ? "إدارة علاقات العملاء" : "CRM & Audiences",
      items: [
        { to: "/admin/crm", icon: Activity, label: language === "ar" ? "نظرة عامة" : "CRM Overview" },
        { to: "/admin/leads", icon: UserSearch, label: language === "ar" ? "العملاء المحتملين" : "Leads" },
        { to: "/admin/audience-segments", icon: Target, label: language === "ar" ? "شرائح الجمهور" : "Audience Segments" },
      ],
    },
    {
      title: language === "ar" ? "النظام والإعدادات" : "System & Settings",
      items: [
        { to: "/admin/settings", icon: Settings, label: language === "ar" ? "الإعدادات العامة" : "General Settings" },
        { to: "/admin/security", icon: ShieldAlert, label: language === "ar" ? "الأمان والحماية" : "Security Center" },
        { to: "/admin/components", icon: Eye, label: language === "ar" ? "إظهار المكونات" : "Component Visibility" },
        { to: "/admin/reports", icon: FileText, label: language === "ar" ? "التقارير" : "Reports" },
        { to: "/admin/performance", icon: BarChart3, label: language === "ar" ? "الأداء" : "Performance" },
        { to: "/admin/localization", icon: Globe, label: language === "ar" ? "اللغات" : "Localization" },
        { to: "/admin/translation-seo", icon: Languages, label: language === "ar" ? "الترجمة وتحسين المحتوى" : "Translation & SEO" },
        { to: "/admin/countries", icon: Earth, label: language === "ar" ? "إدارة الدول" : "Countries" },
        { to: "/admin/integrations", icon: Plug, label: language === "ar" ? "التكاملات" : "Integrations" },
        { to: "/admin/smart-import", icon: Sparkles, label: language === "ar" ? "استيراد ذكي" : "Smart Import" },
        { to: "/admin/ai", icon: Bot, label: language === "ar" ? "الذكاء الاصطناعي" : "AI Configuration" },
        { to: "/admin/audit", icon: FileText, label: language === "ar" ? "سجل العمليات" : "Audit Log" },
        { to: "/admin/database", icon: Database, label: language === "ar" ? "قاعدة البيانات" : "Database" },
      ],
    },
  ];

  const renderNav = (isMobile = false) => (
    <ScrollArea className="flex-1 p-2">
      <nav className="space-y-4">
        {navSections.map((section, idx) => (
          <div key={idx}>
            {(!collapsed || isMobile) && (
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => isMobile && setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      !isMobile && collapsed && "justify-center px-2",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )
                  }
                  title={!isMobile && collapsed ? item.label : undefined}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {(isMobile || !collapsed) && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
            {idx < navSections.length - 1 && (isMobile || !collapsed) && <Separator className="my-3" />}
          </div>
        ))}
      </nav>
    </ScrollArea>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader />
      <div className="flex flex-1">
        {/* Mobile Nav Trigger */}
        <div className="sticky top-14 z-30 flex h-12 items-center border-b bg-card px-4 md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side={language === "ar" ? "right" : "left"} className="w-72 p-0">
              <div className="flex h-full flex-col">
                <div className="flex items-center gap-2 border-b p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Building className="h-4 w-4" />
                  </div>
                  <span className="font-semibold">{language === "ar" ? "لوحة الإدارة" : "Admin Panel"}</span>
                </div>
                {renderNav(true)}
              </div>
            </SheetContent>
          </Sheet>
          <span className="ms-2 text-sm font-medium text-muted-foreground">
            {language === "ar" ? "القائمة" : "Menu"}
          </span>
        </div>

        {/* Desktop Sidebar */}
        <aside 
          className={cn(
            "sticky top-14 hidden h-[calc(100vh-56px)] shrink-0 border-r bg-card transition-all duration-300 md:block",
            collapsed ? "w-16" : "w-64"
          )}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b p-3">
              {!collapsed && (
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Building className="h-4 w-4" />
                  </div>
                  <span className="font-semibold">{language === "ar" ? "لوحة الإدارة" : "Admin Panel"}</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(!collapsed)}
                className={cn("shrink-0", collapsed && "mx-auto")}
              >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>
            {renderNav(false)}
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 flex-1">
          <div className="container py-6">
            <AdminPendingBanner />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
