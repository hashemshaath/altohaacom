import {
  LayoutDashboard,
  BarChart3,
  Users,
  Shield,
  ShieldCheck,
  CreditCard,
  Crown,
  Building,
  Building2,
  Trophy,
  ClipboardCheck,
  Award,
  Landmark,
  Earth,
  ChefHat,
  Calendar,
  Newspaper,
  BookOpen,
  GraduationCap,
  HandHeart,
  Image,
  QrCode,
  Flag,
  Megaphone,
  Package,
  FileText,
  Calculator,
  Ticket,
  Headphones,
  MessageSquare,
  MailOpen,
  Bell,
  Activity,
  UserSearch,
  Target,
  Settings,
  ShieldAlert,
  Globe,
  Plug,
  Sparkles,
  Bot,
  Database,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  icon: LucideIcon;
  labelEn: string;
  labelAr: string;
  end?: boolean;
}

export interface NavSection {
  titleEn: string;
  titleAr: string;
  items: NavItem[];
}

export const adminNavSections: NavSection[] = [
  {
    titleEn: "Dashboard",
    titleAr: "لوحة التحكم",
    items: [
      { to: "/admin", icon: LayoutDashboard, labelEn: "Overview", labelAr: "نظرة عامة", end: true },
      { to: "/admin/analytics", icon: BarChart3, labelEn: "Reports & Analytics", labelAr: "التقارير والتحليلات" },
    ],
  },
  {
    titleEn: "Users & Organizations",
    titleAr: "المستخدمين والجهات",
    items: [
      { to: "/admin/users", icon: Users, labelEn: "Users", labelAr: "المستخدمين" },
      { to: "/admin/roles", icon: Shield, labelEn: "Roles & Permissions", labelAr: "الأدوار والصلاحيات" },
      { to: "/admin/verification", icon: ShieldCheck, labelEn: "Verification", labelAr: "التوثيق والتحقق" },
      { to: "/admin/memberships", icon: CreditCard, labelEn: "Memberships", labelAr: "العضويات" },
      { to: "/admin/loyalty", icon: Crown, labelEn: "Loyalty & Rewards", labelAr: "الولاء والمكافآت" },
      { to: "/admin/companies", icon: Building, labelEn: "Organizations & Companies", labelAr: "الجهات والشركات" },
      { to: "/admin/establishments", icon: Building2, labelEn: "Establishments", labelAr: "المنشآت" },
    ],
  },
  {
    titleEn: "Competitions & Events",
    titleAr: "المسابقات والفعاليات",
    items: [
      { to: "/admin/competitions", icon: Trophy, labelEn: "Competitions", labelAr: "المسابقات" },
      { to: "/admin/evaluation", icon: ClipboardCheck, labelEn: "Evaluation Center", labelAr: "مركز التقييم" },
      { to: "/admin/certificates", icon: Award, labelEn: "Certificates", labelAr: "الشهادات" },
      { to: "/admin/exhibitions", icon: Landmark, labelEn: "Exhibitions & Events", labelAr: "المعارض والفعاليات" },
      { to: "/admin/global-events", icon: Earth, labelEn: "Global Events", labelAr: "التقويم العالمي" },
      { to: "/admin/chefs-table", icon: ChefHat, labelEn: "Chef's Table", labelAr: "طاولة الشيف" },
      { to: "/admin/chef-schedule", icon: Calendar, labelEn: "Chef Schedules", labelAr: "جداول الطهاة" },
    ],
  },
  {
    titleEn: "Content & Media",
    titleAr: "المحتوى والوسائط",
    items: [
      { to: "/admin/articles", icon: Newspaper, labelEn: "Articles & News", labelAr: "المقالات والأخبار" },
      { to: "/admin/knowledge", icon: BookOpen, labelEn: "Knowledge Portal", labelAr: "بوابة المعرفة" },
      { to: "/admin/masterclasses", icon: GraduationCap, labelEn: "Masterclasses", labelAr: "الدورات التعليمية" },
      { to: "/admin/mentorship", icon: HandHeart, labelEn: "Mentorship", labelAr: "الإرشاد" },
      { to: "/admin/media", icon: Image, labelEn: "Media Library", labelAr: "مكتبة الوسائط" },
      { to: "/admin/qr-codes", icon: QrCode, labelEn: "QR Codes", labelAr: "رموز QR" },
      { to: "/admin/moderation", icon: Flag, labelEn: "Moderation", labelAr: "إدارة المحتوى" },
      { to: "/admin/advertising", icon: Megaphone, labelEn: "Advertising", labelAr: "مركز الإعلانات" },
    ],
  },
  {
    titleEn: "Finance & Operations",
    titleAr: "المالية والعمليات",
    items: [
      { to: "/admin/orders", icon: Package, labelEn: "Order Center", labelAr: "مركز الطلبات" },
      { to: "/admin/invoices", icon: FileText, labelEn: "Invoices", labelAr: "الفواتير" },
      { to: "/admin/cost-center", icon: Calculator, labelEn: "Cost Center", labelAr: "مركز التكلفة" },
    ],
  },
  {
    titleEn: "Support & Communications",
    titleAr: "الدعم والتواصل",
    items: [
      { to: "/admin/support-tickets", icon: Ticket, labelEn: "Support Tickets", labelAr: "تذاكر الدعم" },
      { to: "/admin/live-chat", icon: Headphones, labelEn: "Live Support", labelAr: "الدعم المباشر" },
      { to: "/admin/communications", icon: MessageSquare, labelEn: "Communications", labelAr: "صندوق التواصل" },
      { to: "/admin/templates", icon: MailOpen, labelEn: "Templates", labelAr: "قوالب الاتصالات" },
      { to: "/admin/notifications", icon: Bell, labelEn: "Notifications", labelAr: "الإشعارات" },
      { to: "/admin/marketing-automation", icon: Megaphone, labelEn: "Marketing Automation", labelAr: "أتمتة التسويق" },
    ],
  },
  {
    titleEn: "CRM & Audiences",
    titleAr: "إدارة علاقات العملاء",
    items: [
      { to: "/admin/crm", icon: Activity, labelEn: "CRM Overview", labelAr: "نظرة عامة" },
      { to: "/admin/leads", icon: UserSearch, labelEn: "Leads", labelAr: "العملاء المحتملين" },
      { to: "/admin/audience-segments", icon: Target, labelEn: "Audience Segments", labelAr: "شرائح الجمهور" },
    ],
  },
  {
    titleEn: "System & Settings",
    titleAr: "النظام والإعدادات",
    items: [
      { to: "/admin/settings", icon: Settings, labelEn: "General Settings", labelAr: "الإعدادات العامة" },
      { to: "/admin/security", icon: ShieldAlert, labelEn: "Security Center", labelAr: "الأمان والحماية" },
      { to: "/admin/localization", icon: Globe, labelEn: "Localization & Translation", labelAr: "اللغات والترجمة" },
      { to: "/admin/countries", icon: Earth, labelEn: "Countries", labelAr: "إدارة الدول" },
      { to: "/admin/integrations", icon: Plug, labelEn: "Integrations", labelAr: "التكاملات" },
      { to: "/admin/smart-import", icon: Sparkles, labelEn: "Smart Import", labelAr: "استيراد ذكي" },
      { to: "/admin/ai", icon: Bot, labelEn: "AI Configuration", labelAr: "الذكاء الاصطناعي" },
      { to: "/admin/audit", icon: FileText, labelEn: "Audit Log", labelAr: "سجل العمليات" },
      { to: "/admin/database", icon: Database, labelEn: "Database", labelAr: "قاعدة البيانات" },
    ],
  },
];
