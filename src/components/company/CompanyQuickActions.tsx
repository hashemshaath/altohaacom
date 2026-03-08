import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShoppingCart, FileText, Users, Megaphone, Package, BarChart3,
  MessageSquare, Image,
} from "lucide-react";

const QUICK_ACTIONS = [
  { icon: ShoppingCart, labelEn: "New Order", labelAr: "طلب جديد", to: "/company/orders", color: "bg-primary/10 text-primary" },
  { icon: FileText, labelEn: "Invoices", labelAr: "الفواتير", to: "/company/invoices", color: "bg-chart-4/10 text-chart-4" },
  { icon: Users, labelEn: "Team", labelAr: "الفريق", to: "/company/team", color: "bg-chart-3/10 text-chart-3" },
  { icon: Package, labelEn: "Catalog", labelAr: "الكتالوج", to: "/company/catalog", color: "bg-chart-5/10 text-chart-5" },
  { icon: Megaphone, labelEn: "Advertising", labelAr: "الإعلانات", to: "/company/advertising", color: "bg-chart-1/10 text-chart-1" },
  { icon: BarChart3, labelEn: "Analytics", labelAr: "التحليلات", to: "/company/analytics", color: "bg-chart-2/10 text-chart-2" },
  { icon: MessageSquare, labelEn: "Messages", labelAr: "الرسائل", to: "/company/communications", color: "bg-primary/10 text-primary" },
  { icon: Image, labelEn: "Media", labelAr: "الوسائط", to: "/company/media", color: "bg-chart-4/10 text-chart-4" },
];

export function CompanyQuickActions() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
      {QUICK_ACTIONS.map((action, idx) => {
        const Icon = action.icon;
        return (
          <Link key={action.to} to={action.to}>
            <Card
              className="group cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.97] hover:-translate-y-0.5 border-transparent hover:border-border animate-fade-in"
              style={{ animationDelay: `${idx * 0.03}s` }}
            >
              <CardContent className="flex flex-col items-center gap-1.5 p-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.color} transition-transform group-hover:scale-110 group-active:scale-95`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground text-center leading-tight transition-colors">
                  {isAr ? action.labelAr : action.labelEn}
                </span>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
