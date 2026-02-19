import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Filter, ArrowDown } from "lucide-react";

const STAGES = [
  { key: "new", en: "New", ar: "جديد", color: "bg-primary" },
  { key: "contacted", en: "Contacted", ar: "تم التواصل", color: "bg-chart-3" },
  { key: "qualified", en: "Qualified", ar: "مؤهل", color: "bg-chart-4" },
  { key: "proposal", en: "Proposal", ar: "عرض", color: "bg-chart-5" },
  { key: "won", en: "Won", ar: "ناجح", color: "bg-chart-5" },
  { key: "lost", en: "Lost", ar: "خسارة", color: "bg-destructive" },
];

export function PipelineFunnelView() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: leadsByStage } = useQuery({
    queryKey: ["crmPipelineFunnel"],
    queryFn: async () => {
      const { data } = await supabase.from("leads").select("id, status");
      const leads = data || [];
      const map: Record<string, { count: number; value: number }> = {};
      STAGES.forEach(s => { map[s.key] = { count: 0, value: 0 }; });
      leads.forEach(l => {
        const status = l.status || "new";
        if (map[status]) {
          map[status].count++;
        }
      });
      return map;
    },
  });

  const maxCount = Math.max(1, ...Object.values(leadsByStage || {}).map(s => s.count));
  const activeStages = STAGES.filter(s => s.key !== "lost");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          {isAr ? "قمع المبيعات" : "Lead Pipeline Funnel"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {activeStages.map((stage, i) => {
          const data = leadsByStage?.[stage.key] || { count: 0, value: 0 };
          const widthPercent = Math.max(20, (data.count / maxCount) * 100);
          const prevCount = i > 0 ? (leadsByStage?.[activeStages[i - 1].key]?.count || 0) : data.count;
          const convRate = prevCount > 0 && i > 0 ? Math.round((data.count / prevCount) * 100) : null;

          return (
            <div key={stage.key}>
              <div className="flex items-center gap-2 group">
                <div
                  className={`${stage.color} h-10 rounded-md flex items-center justify-between px-3 transition-all group-hover:opacity-90`}
                  style={{ width: `${widthPercent}%`, minWidth: "120px" }}
                >
                  <span className="text-xs font-medium text-primary-foreground">
                    {isAr ? stage.ar : stage.en}
                  </span>
                  <span className="text-xs font-bold text-primary-foreground">
                    {data.count}
                  </span>
                </div>
                {convRate !== null && (
                  <Badge variant="outline" className="text-[9px] shrink-0">
                    {convRate}%
                  </Badge>
                )}
              </div>
              {i < activeStages.length - 1 && (
                <div className="flex justify-center py-0.5">
                  <ArrowDown className="h-3 w-3 text-muted-foreground/40" />
                </div>
              )}
            </div>
          );
        })}

        {/* Lost separately */}
        {leadsByStage?.lost && leadsByStage.lost.count > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center gap-2">
              <div className="bg-destructive/15 h-8 rounded-md flex items-center justify-between px-3" style={{ width: "40%" }}>
                <span className="text-xs font-medium text-destructive">{isAr ? "خسارة" : "Lost"}</span>
                <span className="text-xs font-bold text-destructive">{leadsByStage.lost.count}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
