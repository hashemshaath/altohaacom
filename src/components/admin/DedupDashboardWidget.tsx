import { memo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScanSearch, Merge, ArrowRight, Clock } from "lucide-react";
import { format } from "date-fns";

export const DedupDashboardWidget = memo(function DedupDashboardWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["dedup-widget-stats"],
    queryFn: async () => {
      const [{ count: mergeCount }, { data: recentMerges }] = await Promise.all([
        supabase
          .from("admin_actions")
          .select("*", { count: "exact", head: true })
          .eq("action_type", "entity_merge"),
        supabase
          .from("admin_actions")
          .select("id, details, created_at")
          .eq("action_type", "entity_merge")
          .order("created_at", { ascending: false })
          .limit(3),
      ]);
      return { mergeCount: mergeCount || 0, recentMerges: recentMerges || [] };
    },
    staleTime: 60_000,
  });

  return (
    <Card className="rounded-2xl border-border/40">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <ScanSearch className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">{isAr ? "فاحص التكرارات" : "Deduplication"}</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {isAr ? "تنظيف وتوحيد البيانات" : "Data cleanup & entity merging"}
            </CardDescription>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/deduplication">
            {isAr ? "فتح المركز" : "Open Center"}
            <ArrowRight className="ms-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-xl border p-3 flex-1">
            <Merge className="h-4 w-4 text-primary" />
            <div>
              <div className="text-lg font-bold">{data?.mergeCount || 0}</div>
              <div className="text-[10px] text-muted-foreground">{isAr ? "عمليات الدمج" : "Total Merges"}</div>
            </div>
          </div>
          <Button variant="default" size="sm" className="gap-1.5" asChild>
            <Link to="/admin/deduplication">
              <ScanSearch className="h-3.5 w-3.5" />
              {isAr ? "فحص شامل" : "Run Scan"}
            </Link>
          </Button>
        </div>

        {data?.recentMerges && data.recentMerges.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              {isAr ? "آخر العمليات" : "Recent Merges"}
            </div>
            {data.recentMerges.map((m: any) => {
              const details = m.details as any;
              return (
                <div key={m.id} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-muted/30">
                  <Merge className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="truncate flex-1">{details?.primary_name || "—"}</span>
                  <Badge variant="secondary" className="text-[9px]">+{details?.merged_count || 0}</Badge>
                  <span className="text-[9px] text-muted-foreground shrink-0">
                    <Clock className="h-2.5 w-2.5 inline me-0.5" />
                    {format(new Date(m.created_at), "MMM d")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
