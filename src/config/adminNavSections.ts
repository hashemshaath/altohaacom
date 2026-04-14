import {
  Palette,
  PanelTop,
  Home,
  Layers,
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
  ScanSearch,
  ImagePlay,
  Code,
  Zap,
  CalendarRange,
  LayoutGrid,
  MapPin,
  ClipboardList,
  Upload,
  Search,
  type, LucideIcon,
, LucideIcon } from "lucide-react";

export interface NavItem {
  to: string;
  icon: LucideIcon;
  labelEn: string;
  labelAr: string;
  end?: boolean;
  /** If true, only full admins (supervisor/organizer) can see this item */
  fullAdminOnly?: boolean;
  /** If true, only Super Admin (supervisor) can see this item — Admin role cannot */
  superAdminOnly?: boolean;
}

export interface NavSection {
  titleEn: string;
  titleAr: string;
  items: NavItem[];
  /** If true, the entire section is full-admin only */
  fullAdminOnly?: boolean;
  /** If true, the entire section is Super Admin only */
  superAdminOnly?: boolean;
}

export const adminNavSections: NavSection[] = [
  /* ── 1. Overview ── */
  {
    titleEn: "Overview",
    titleAr: "نظرة عامة",
    items: [
      { to: "/admin", icon: LayoutDashboard, labelEn: "Dashboard", labelAr: "لوحة التحكم", end: true },
      { to: "/admin/analytics", icon: BarChart3, labelEn: "Analytics", labelAr: "التحليلات", fullAdminOnly: true },
    ],
  },

  /* ── 2. Users (Super Admin only) ── */
  {
    titleEn: "Users",
    titleAr: "المستخدمين",
    superAdminOnly: true,
    items: [
      { to: "/admin/users", icon: Users, labelEn: "All Users", labelAr: "جميع المستخدمين" },
      { to: "/admin/roles", icon: Shield, labelEn: "Roles", labelAr: "الأدوار" },
      { to: "/admin/verification", icon: ShieldCheck, labelEn: "Verification", labelAr: "التوثيق" },
      { to: "/admin/memberships", icon: CreditCard, labelEn: "Memberships", labelAr: "العضويات" },
      { to: "/admin/loyalty", icon: Crown, labelEn: "Loyalty", labelAr: "الولاء" },
    ],
  },

  /* ── 3. Organizations ── */
  {
    titleEn: "Organizations",
    titleAr: "الجهات",
    items: [
      { to: "/admin/companies", icon: Building, labelEn: "Companies", labelAr: "الشركات" },
      { to: "/admin/establishments", icon: Building2, labelEn: "Establishments", labelAr: "المنشآت" },
      { to: "/admin/organizers", icon: Landmark, labelEn: "Organizers", labelAr: "المنظمين", superAdminOnly: true },
    ],
  },

  /* ── 4. CRM & Marketing ── */
  {
    titleEn: "CRM & Marketing",
    titleAr: "العلاقات والتسويق",
    fullAdminOnly: true,
    items: [
      { to: "/admin/crm", icon: Activity, labelEn: "CRM", labelAr: "إدارة العلاقات" },
      { to: "/admin/leads", icon: UserSearch, labelEn: "Leads", labelAr: "العملاء المحتملين" },
      { to: "/admin/audience-segments", icon: Target, labelEn: "Segments", labelAr: "الشرائح" },
      { to: "/admin/advertising", icon: Megaphone, labelEn: "Advertising", labelAr: "الإعلانات" },
      { to: "/admin/marketing-automation", icon: Zap, labelEn: "Automation", labelAr: "الأتمتة" },
    ],
  },

  /* ── 5. Events & Competitions ── */
  {
    titleEn: "Events & Competitions",
    titleAr: "الفعاليات والمسابقات",
    fullAdminOnly: true,
    items: [
      { to: "/admin/exhibitions", icon: Earth, labelEn: "Exhibitions & Events", labelAr: "المعارض والفعاليات" },
      { to: "/admin/exhibition-stats", icon: BarChart3, labelEn: "Event Statistics", labelAr: "إحصائيات الفعاليات" },
      { to: "/admin/organizers", icon: Building2, labelEn: "Organizers", labelAr: "المنظمون" },
      { to: "/admin/competitions", icon: Trophy, labelEn: "Competitions", labelAr: "المسابقات" },
      { to: "/admin/evaluation", icon: ClipboardCheck, labelEn: "Evaluation", labelAr: "التقييم" },
      { to: "/admin/certificates", icon: Award, labelEn: "Certificates", labelAr: "الشهادات" },
      { to: "/admin/chefs-table", icon: ChefHat, labelEn: "Chef's Table", labelAr: "طاولة الشيف" },
      { to: "/admin/chef-schedule", icon: Calendar, labelEn: "Schedules", labelAr: "الجداول" },
      { to: "/admin/global-events", icon: CalendarRange, labelEn: "Global Events", labelAr: "التقويم العالمي" },
    ],
  },

  /* ── 7. Content & SEO ── */
  {
    titleEn: "Content & SEO",
    titleAr: "المحتوى والسيو",
    items: [
      { to: "/admin/articles", icon: Newspaper, labelEn: "Articles", labelAr: "المقالات" },
      { to: "/admin/design/homepage", icon: Home, labelEn: "Homepage", labelAr: "الرئيسية" },
      { to: "/admin/hero-slides", icon: ImagePlay, labelEn: "Hero Slides", labelAr: "شرائح البانر" },
      { to: "/admin/auth-slides", icon: ImagePlay, labelEn: "Auth Slides", labelAr: "شرائح التسجيل" },
      { to: "/admin/design/covers", icon: Layers, labelEn: "Covers", labelAr: "الأغلفة" },
      { to: "/admin/seo", icon: Search, labelEn: "SEO Dashboard", labelAr: "لوحة SEO" },
      { to: "/admin/knowledge", icon: BookOpen, labelEn: "Knowledge", labelAr: "المعرفة" },
      { to: "/admin/masterclasses", icon: GraduationCap, labelEn: "Masterclasses", labelAr: "الدورات" },
      { to: "/admin/mentorship", icon: HandHeart, labelEn: "Mentorship", labelAr: "الإرشاد", superAdminOnly: true },
      { to: "/admin/media", icon: Image, labelEn: "Media", labelAr: "الوسائط" },
      { to: "/admin/moderation", icon: Flag, labelEn: "Moderation", labelAr: "الإشراف" },
      { to: "/admin/qr-codes", icon: QrCode, labelEn: "QR Codes", labelAr: "رموز QR" },
    ],
  },

  /* ── 8. Finance (Super Admin only) ── */
  {
    titleEn: "Finance",
    titleAr: "المالية",
    superAdminOnly: true,
    items: [
      { to: "/admin/orders", icon: Package, labelEn: "Orders", labelAr: "الطلبات" },
      { to: "/admin/invoices", icon: FileText, labelEn: "Invoices", labelAr: "الفواتير" },
      { to: "/admin/cost-center", icon: Calculator, labelEn: "Cost Center", labelAr: "التكلفة" },
    ],
  },

  /* ── 9. Communications ── */
  {
    titleEn: "Communications",
    titleAr: "التواصل",
    fullAdminOnly: true,
    items: [
      { to: "/admin/support-tickets", icon: Ticket, labelEn: "Tickets", labelAr: "التذاكر" },
      { to: "/admin/live-chat", icon: Headphones, labelEn: "Live Chat", labelAr: "الدعم المباشر" },
      { to: "/admin/communications", icon: MessageSquare, labelEn: "Messages", labelAr: "الرسائل" },
      { to: "/admin/templates", icon: MailOpen, labelEn: "Templates", labelAr: "القوالب" },
      { to: "/admin/notifications", icon: Bell, labelEn: "Notifications", labelAr: "الإشعارات" },
    ],
  },

  /* ── 10. Design & Branding ── */
  {
    titleEn: "Design & Branding",
    titleAr: "التصميم والهوية",
    fullAdminOnly: true,
    items: [
      { to: "/admin/design", icon: Palette, labelEn: "Overview", labelAr: "نظرة عامة", end: true },
      { to: "/admin/design/theme", icon: Palette, labelEn: "Theme & Appearance", labelAr: "المظهر والثيم" },
      { to: "/admin/design/brand-identity", icon: Sparkles, labelEn: "Branding", labelAr: "الهوية" },
      { to: "/admin/design/header-footer", icon: PanelTop, labelEn: "Header & Footer", labelAr: "الرأس والتذييل" },
      { to: "/admin/design/layout", icon: LayoutGrid, labelEn: "Layout", labelAr: "التخطيط" },
      { to: "/admin/design/custom-css", icon: Code, labelEn: "Custom CSS", labelAr: "CSS مخصص" },
    ],
  },

  /* ── 11. System (Super Admin only) ── */
  {
    titleEn: "System",
    titleAr: "النظام",
    superAdminOnly: true,
    items: [
      { to: "/admin/settings", icon: Settings, labelEn: "Settings", labelAr: "الإعدادات" },
      { to: "/admin/security", icon: ShieldAlert, labelEn: "Security", labelAr: "الأمان" },
      { to: "/admin/localization", icon: Globe, labelEn: "Languages", labelAr: "اللغات" },
      { to: "/admin/countries", icon: MapPin, labelEn: "Countries", labelAr: "الدول" },
      { to: "/admin/settings?tab=integrations", icon: Plug, labelEn: "Integrations", labelAr: "التكاملات" },
    ],
  },

  /* ── 12. Tools (Super Admin only) ── */
  {
    titleEn: "Tools",
    titleAr: "الأدوات",
    superAdminOnly: true,
    items: [
      { to: "/admin/smart-import", icon: Upload, labelEn: "Smart Import", labelAr: "استيراد ذكي" },
      { to: "/admin/deduplication", icon: ScanSearch, labelEn: "Deduplication", labelAr: "التكرارات" },
      { to: "/admin/ai", icon: Bot, labelEn: "AI Config", labelAr: "الذكاء الاصطناعي" },
      { to: "/admin/audit", icon: ClipboardList, labelEn: "Audit Log", labelAr: "سجل العمليات" },
      { to: "/admin/database", icon: Database, labelEn: "Database", labelAr: "قاعدة البيانات" },
      { to: "/admin/data-import-export", icon: Upload, labelEn: "Import/Export", labelAr: "استيراد/تصدير" },
    ],
  },
];
