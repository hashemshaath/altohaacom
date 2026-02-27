import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Send, FileText, Trophy, Landmark, Users, Shield,
  Zap, Upload, QrCode, Award, Package, type LucideIcon,
} from "lucide-react";

interface QuickAction {
  icon: LucideIcon;
  labelEn: string;
  labelAr: string;
  link: string;
  color: string;
  badge?: number;
}

export function AdminQuickActionsBar({ pendingReports }: { pendingReports?: number }) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const actions: QuickAction[] = [
    { icon: Plus, labelEn: "Competition", labelAr: "مسابقة", link: "/admin/competitions", color: "text-chart-2" },
    { icon: Landmark, labelEn: "Exhibition", labelAr: "معرض", link: "/admin/exhibitions", color: "text-chart-3" },
    { icon: FileText, labelEn: "Article", labelAr: "مقال", link: "/admin/articles", color: "text-chart-5" },
    { icon: Send, labelEn: "Notification", labelAr: "إشعار", link: "/admin/notifications", color: "text-chart-4" },
    { icon: Award, labelEn: "Certificate", labelAr: "شهادة", link: "/admin/certificates", color: "text-primary" },
    { icon: Users, labelEn: "User", labelAr: "مستخدم", link: "/admin/users", color: "text-primary" },
    { icon: Package, labelEn: "Order", labelAr: "طلب", link: "/admin/orders", color: "text-chart-2" },
    { icon: Upload, labelEn: "Import", labelAr: "استيراد", link: "/admin/smart-import", color: "text-chart-4" },
    { icon: QrCode, labelEn: "QR Code", labelAr: "QR", link: "/admin/qr-codes", color: "text-chart-3" },
    { icon: Shield, labelEn: "Security", labelAr: "الأمان", link: "/admin/security", color: "text-destructive", badge: pendingReports },
  ];

  return (
    <Card className="border-border/50 bg-gradient-to-r from-muted/30 to-transparent">
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <span className="text-[10px] text-muted-foreground whitespace-nowrap font-medium">
            <Zap className="inline h-3 w-3 me-1" />{isAr ? "إنشاء سريع:" : "Quick Create:"}
          </span>
          {actions.map((action) => (
            <Button key={action.link} variant="ghost" size="sm" asChild className="h-7 px-2.5 text-xs gap-1.5 whitespace-nowrap shrink-0 relative">
              <Link to={action.link}>
                <action.icon className={`h-3 w-3 ${action.color}`} />
                {isAr ? action.labelAr : action.labelEn}
                {action.badge && action.badge > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -end-1 h-4 min-w-4 text-[8px] p-0 flex items-center justify-center">
                    {action.badge}
                  </Badge>
                )}
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
