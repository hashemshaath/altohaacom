import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home, Users, Trophy, FileText, Landmark, ShieldCheck, Bell,
  Package, DollarSign, Award, BarChart3, Megaphone, Settings,
  BookOpen, Compass, Building2, GraduationCap, MessageSquare,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    labelEn: "Core",
    labelAr: "أساسي",
    items: [
      { path: "/admin", icon: Home, labelEn: "Dashboard", labelAr: "لوحة التحكم" },
      { path: "/admin/users", icon: Users, labelEn: "Users", labelAr: "المستخدمون" },
      { path: "/admin/competitions", icon: Trophy, labelEn: "Competitions", labelAr: "المسابقات" },
      { path: "/admin/articles", icon: FileText, labelEn: "Articles", labelAr: "المقالات" },
    ],
  },
  {
    labelEn: "Content",
    labelAr: "المحتوى",
    items: [
      { path: "/admin/exhibitions", icon: Landmark, labelEn: "Exhibitions", labelAr: "المعارض" },
      { path: "/admin/masterclasses", icon: GraduationCap, labelEn: "Courses", labelAr: "الدورات" },
      { path: "/admin/knowledge", icon: BookOpen, labelEn: "Knowledge", labelAr: "المعرفة" },
      { path: "/admin/companies", icon: Building2, labelEn: "Companies", labelAr: "الشركات" },
    ],
  },
  {
    labelEn: "Operations",
    labelAr: "العمليات",
    items: [
      { path: "/admin/orders", icon: Package, labelEn: "Orders", labelAr: "الطلبات" },
      { path: "/admin/finance", icon: DollarSign, labelEn: "Finance", labelAr: "المالية" },
      { path: "/admin/certificates", icon: Award, labelEn: "Certificates", labelAr: "الشهادات" },
      { path: "/admin/ads", icon: Megaphone, labelEn: "Ads", labelAr: "الإعلانات" },
    ],
  },
  {
    labelEn: "System",
    labelAr: "النظام",
    items: [
      { path: "/admin/notifications", icon: Bell, labelEn: "Notifications", labelAr: "الإشعارات" },
      { path: "/admin/security", icon: ShieldCheck, labelEn: "Security", labelAr: "الأمان" },
      { path: "/admin/analytics", icon: BarChart3, labelEn: "Analytics", labelAr: "التحليلات" },
      { path: "/admin/settings", icon: Settings, labelEn: "Settings", labelAr: "الإعدادات" },
    ],
  },
];

export function PageNavigationWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Compass className="h-4 w-4 text-primary" />
          {isAr ? "التنقل السريع" : "Quick Navigation"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <ScrollArea className="w-full">
          <div className="flex gap-4 min-w-max pb-2">
            {NAV_SECTIONS.map((section) => (
              <div key={section.labelEn} className="space-y-1.5">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {isAr ? section.labelAr : section.labelEn}
                </span>
                <div className="flex flex-col gap-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Button
                        key={item.path}
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        className="justify-start gap-2 h-7 text-xs px-2"
                        onClick={() => navigate(item.path)}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        {isAr ? item.labelAr : item.labelEn}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="h-1.5" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
