import { useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, CheckCircle2, Calendar, ChefHat, Star, ArrowRight } from "lucide-react";
import type { ChefsTableRequest, ChefsTableSession } from "@/hooks/useChefsTable";

interface Props {
  requests: ChefsTableRequest[];
  sessions: ChefsTableSession[];
}

export function ChefsTablePipeline({ requests, sessions }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const stages = useMemo(() => {
    const pending = requests.filter(r => r.status === "pending").length;
    const approved = requests.filter(r => r.status === "approved").length;
    const scheduled = sessions.filter(s => s.status === "scheduled").length;
    const inProgress = sessions.filter(s => s.status === "in_progress").length;
    const completed = sessions.filter(s => s.status === "completed").length;

    return [
      {
        label: isAr ? "طلبات معلقة" : "Pending Requests",
        count: pending,
        icon: FileText,
        color: "bg-chart-4/10 text-chart-4 border-chart-4/20",
        barColor: "bg-chart-4",
      },
      {
        label: isAr ? "تمت الموافقة" : "Approved",
        count: approved,
        icon: CheckCircle2,
        color: "bg-chart-5/10 text-chart-5 border-chart-5/20",
        barColor: "bg-chart-5",
      },
      {
        label: isAr ? "مجدولة" : "Scheduled",
        count: scheduled,
        icon: Calendar,
        color: "bg-primary/10 text-primary border-primary/20",
        barColor: "bg-primary",
      },
      {
        label: isAr ? "قيد التنفيذ" : "In Progress",
        count: inProgress,
        icon: ChefHat,
        color: "bg-chart-2/10 text-chart-2 border-chart-2/20",
        barColor: "bg-chart-2",
      },
      {
        label: isAr ? "مكتملة" : "Completed",
        count: completed,
        icon: Star,
        color: "bg-chart-1/10 text-chart-1 border-chart-1/20",
        barColor: "bg-chart-1",
      },
    ];
  }, [requests, sessions, isAr]);

  const maxCount = Math.max(...stages.map(s => s.count), 1);

  return (
    <Card className="border-border/40 overflow-hidden">
      <CardContent className="p-4">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-4">
          {isAr ? "مسار العمل" : "Workflow Pipeline"}
        </p>
        <div className="flex items-stretch gap-1">
          {stages.map((stage, i) => (
            <div key={i} className="flex items-center flex-1 min-w-0">
              <div className={`flex-1 rounded-xl border p-3 ${stage.color} transition-all hover:scale-[1.02]`}>
                <div className="flex items-center gap-2 mb-2">
                  <stage.icon className="h-4 w-4 shrink-0" />
                  <span className="text-[10px] font-bold truncate">{stage.label}</span>
                </div>
                <p className="text-2xl font-black tabular-nums">{stage.count}</p>
                <div className="mt-2 h-1 rounded-full bg-background/50 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${stage.barColor} transition-all duration-500`}
                    style={{ width: `${(stage.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
              {i < stages.length - 1 && (
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 mx-0.5" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
