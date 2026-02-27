import { useLanguage } from "@/i18n/LanguageContext";
import { Link, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Users, Trophy, FileText, Shield, Package, Settings,
  BarChart3, Landmark, MessageSquare, CreditCard, Zap,
  Bell, GraduationCap, Globe, Ticket, Megaphone,
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/admin/users", icon: Users, en: "Users", ar: "المستخدمين", color: "text-primary" },
  { path: "/admin/competitions", icon: Trophy, en: "Competitions", ar: "المسابقات", color: "text-chart-2" },
  { path: "/admin/articles", icon: FileText, en: "Articles", ar: "المقالات", color: "text-chart-5" },
  { path: "/admin/exhibitions", icon: Landmark, en: "Exhibitions", ar: "المعارض", color: "text-chart-3" },
  { path: "/admin/orders", icon: Package, en: "Orders", ar: "الطلبات", color: "text-chart-4" },
  { path: "/admin/analytics", icon: BarChart3, en: "Analytics", ar: "التحليلات", color: "text-chart-1" },
  { path: "/admin/security", icon: Shield, en: "Security", ar: "الأمان", color: "text-destructive" },
  { path: "/admin/masterclasses", icon: GraduationCap, en: "Courses", ar: "الدورات", color: "text-chart-2" },
  { path: "/admin/notifications", icon: Bell, en: "Notifications", ar: "الإشعارات", color: "text-chart-3" },
  { path: "/admin/support-tickets", icon: Ticket, en: "Support", ar: "الدعم", color: "text-chart-4" },
  { path: "/admin/memberships", icon: CreditCard, en: "Memberships", ar: "العضويات", color: "text-primary" },
  { path: "/admin/settings", icon: Settings, en: "Settings", ar: "الإعدادات", color: "text-muted-foreground" },
];

export function AdminQuickNavWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const location = useLocation();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4 text-chart-4" />
          {isAr ? "التنقل السريع" : "Quick Navigation"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg transition-all text-center hover:bg-muted/50",
                  isActive && "bg-primary/10 ring-1 ring-primary/20"
                )}
              >
                <item.icon className={cn("h-4 w-4", item.color)} />
                <span className="text-[9px] text-muted-foreground leading-tight">
                  {isAr ? item.ar : item.en}
                </span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
