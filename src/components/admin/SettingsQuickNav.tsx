import { memo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import { Settings, Home, Globe, Shield, Users, Database, Palette } from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin/settings", icon: Settings, labelEn: "Settings", labelAr: "الإعدادات" },
  { href: "/admin/design/homepage", icon: Home, labelEn: "Homepage", labelAr: "الرئيسية" },
  { href: "/admin/design/identity", icon: Palette, labelEn: "Design", labelAr: "التصميم" },
  { href: "/admin/localization", icon: Globe, labelEn: "Localization", labelAr: "التعريب" },
  { href: "/admin/security", icon: Shield, labelEn: "Security", labelAr: "الأمان" },
  { href: "/admin/roles", icon: Users, labelEn: "Roles", labelAr: "الأدوار" },
  { href: "/admin/database", icon: Database, labelEn: "Database", labelAr: "قاعدة البيانات" },
];

export const SettingsQuickNav = memo(function SettingsQuickNav() {
  const { language } = useLanguage();
  const location = useLocation();
  const isAr = language === "ar";

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-200 shrink-0",
              isActive
                ? "border-primary/30 bg-primary/10 text-primary shadow-sm"
                : "border-border/40 bg-card hover:border-border/70 hover:bg-muted/40 text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span>{isAr ? item.labelAr : item.labelEn}</span>
          </Link>
        );
      })}
    </div>
  );
});
