import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  BarChart3, Users, Trophy, FileText, Bell, Shield,
  Landmark, Zap, Package, Award, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileAction {
  icon: LucideIcon;
  labelEn: string;
  labelAr: string;
  link: string;
  color: string;
}

const actions: MobileAction[] = [
  { icon: BarChart3, labelEn: "Analytics", labelAr: "التحليلات", link: "/admin/analytics", color: "text-primary" },
  { icon: Users, labelEn: "Users", labelAr: "المستخدمين", link: "/admin/users", color: "text-chart-2" },
  { icon: Trophy, labelEn: "Competitions", labelAr: "المسابقات", link: "/admin/competitions", color: "text-chart-4" },
  { icon: Landmark, labelEn: "Exhibitions", labelAr: "المعارض", link: "/admin/exhibitions", color: "text-chart-3" },
  { icon: Package, labelEn: "Orders", labelAr: "الطلبات", link: "/admin/orders", color: "text-chart-5" },
  { icon: Bell, labelEn: "Notifications", labelAr: "الإشعارات", link: "/admin/notifications", color: "text-chart-4" },
  { icon: FileText, labelEn: "Articles", labelAr: "المقالات", link: "/admin/articles", color: "text-chart-2" },
  { icon: Shield, labelEn: "Security", labelAr: "الأمان", link: "/admin/security", color: "text-destructive" },
];

export function AdminMobileNavGrid() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="grid grid-cols-4 gap-2 md:hidden">
      {actions.map((action) => (
        <Link key={action.link} to={action.link}>
          <Card className="border-border/40 hover:border-primary/30 transition-colors active:scale-95">
            <CardContent className="p-3 flex flex-col items-center gap-1.5">
              <div className={cn("h-8 w-8 rounded-xl bg-muted/60 flex items-center justify-center")}>
                <action.icon className={cn("h-4 w-4", action.color)} />
              </div>
              <span className="text-[9px] font-medium text-center leading-tight">
                {isAr ? action.labelAr : action.labelEn}
              </span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
