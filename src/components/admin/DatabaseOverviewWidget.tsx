import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, HardDrive, Users, FileText, Image, MessageSquare, Trophy } from "lucide-react";
import { formatNumber } from "@/lib/formatNumber";
import { AnimatedCounter } from "@/components/ui/animated-counter";

/**
 * Shows database table row counts for key tables — 
 * helps admins monitor data growth at a glance.
 */
export const DatabaseOverviewWidget = memo(function DatabaseOverviewWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-db-overview"],
    queryFn: async () => {
      const tables = [
        { key: "profiles", table: "profiles" },
        { key: "posts", table: "posts" },
        { key: "competitions", table: "competitions" },
        { key: "recipes", table: "recipes" },
        { key: "articles", table: "articles" },
        { key: "companies", table: "companies" },
      ] as const;

      const results: Record<string, number> = {};
      for (const t of tables) {
        const { count } = await (supabase.from(t.table).select("id", { count: "exact", head: true }) as any);
        results[t.key] = count ?? 0;
      }
      return results;
    },
    staleTime: 1000 * 60 * 5,
  });

  const rows = [
    { key: "profiles", icon: Users, en: "Users", ar: "المستخدمين", color: "text-primary" },
    { key: "posts", icon: MessageSquare, en: "Posts", ar: "المنشورات", color: "text-chart-4" },
    { key: "competitions", icon: Trophy, en: "Competitions", ar: "المسابقات", color: "text-chart-2" },
    { key: "recipes", icon: FileText, en: "Recipes", ar: "الوصفات", color: "text-chart-3" },
    { key: "articles", icon: FileText, en: "Articles", ar: "المقالات", color: "text-chart-5" },
    { key: "companies", icon: HardDrive, en: "Companies", ar: "الشركات", color: "text-chart-1" },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" />
          {isAr ? "نظرة عامة على البيانات" : "Data Overview"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {rows.map((r) => {
            const Icon = r.icon;
            const val = data?.[r.key] ?? 0;
            return (
              <div key={r.key} className="flex items-center gap-2 rounded-xl bg-muted/40 p-2">
                <Icon className={`h-4 w-4 shrink-0 ${r.color}`} />
                <div className="min-w-0">
                  <AnimatedCounter value={isLoading ? 0 : val} className="text-sm leading-none" />
                  <p className="text-[10px] text-muted-foreground truncate">{isAr ? r.ar : r.en}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});
