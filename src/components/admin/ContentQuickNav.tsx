import { memo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FileText, Image, BookOpen, ShieldCheck, Tag } from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin/articles", icon: FileText, labelEn: "Articles", labelAr: "المقالات", countKey: "draft" },
  { href: "/admin/media", icon: Image, labelEn: "Media", labelAr: "الوسائط" },
  { href: "/admin/masterclasses", icon: BookOpen, labelEn: "Masterclasses", labelAr: "دروس الطهي" },
  { href: "/admin/content-moderation", icon: ShieldCheck, labelEn: "Moderation", labelAr: "الإشراف" },
  { href: "/admin/knowledge", icon: Tag, labelEn: "Knowledge", labelAr: "المعرفة" },
];

export const ContentQuickNav = memo(function ContentQuickNav() {
  const { language } = useLanguage();
  const location = useLocation();
  const isAr = language === "ar";

  const { data: counts } = useQuery({
    queryKey: ["content-nav-counts"],
    queryFn: async () => {
      const [draftsRes] = await Promise.allSettled([
        supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "draft"),
      ]);
      return {
        draft: draftsRes.status === "fulfilled" ? draftsRes.value.count || 0 : 0,
      };
    },
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.href;
        const count = item.countKey && counts ? (counts as any)[item.countKey] : 0;
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
            {count > 0 && (
              <Badge
                variant="secondary"
                className={cn(
                  "text-[9px] px-1.5 py-0 h-4 min-w-[18px] justify-center",
                  isActive ? "bg-primary/20 text-primary" : ""
                )}
              >
                {count}
              </Badge>
            )}
          </Link>
        );
      })}
    </div>
  );
});
