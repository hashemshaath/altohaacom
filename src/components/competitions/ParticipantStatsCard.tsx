import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Progress } from "@/components/ui/progress";
import { Users, CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ParticipantStatsCardProps {
  competitionId: string;
  maxParticipants: number | null;
}

export function ParticipantStatsCard({ competitionId, maxParticipants }: ParticipantStatsCardProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: stats } = useQuery({
    queryKey: ["participant-stats", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_registrations")
        .select("status")
        .eq("competition_id", competitionId);
      if (error) throw error;

      const approved = data.filter((r) => r.status === "approved").length;
      const pending = data.filter((r) => r.status === "pending").length;
      const rejected = data.filter((r) => r.status === "rejected").length;
      return { total: data.length, approved, pending, rejected };
    },
  });

  if (!stats) return null;

  const capacity = maxParticipants ? Math.round((stats.approved / maxParticipants) * 100) : null;

  const statItems = [
    { icon: CheckCircle, value: stats.approved, label: isAr ? "مقبول" : "Approved", color: "text-chart-5", bg: "bg-gradient-to-b from-chart-5/12 to-chart-5/4", ring: "ring-chart-5/15" },
    { icon: Clock, value: stats.pending, label: isAr ? "معلق" : "Pending", color: "text-chart-4", bg: "bg-gradient-to-b from-chart-4/12 to-chart-4/4", ring: "ring-chart-4/15" },
    { icon: XCircle, value: stats.rejected, label: isAr ? "مرفوض" : "Rejected", color: "text-destructive", bg: "bg-gradient-to-b from-destructive/10 to-destructive/3", ring: "ring-destructive/10" },
  ];

  return (
    <div className="overflow-hidden rounded-3xl border border-border/30 bg-card shadow-sm transition-shadow duration-300 hover:shadow-md">
      <div className="border-b border-border/20 bg-gradient-to-r from-muted/30 to-transparent px-5 py-3.5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2.5 font-bold text-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
              <Users className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "إحصائيات المشاركين" : "Participant Stats"}
          </h3>
          <Badge variant="secondary" className="text-[10px] font-bold tabular-nums">
            {stats.total} {isAr ? "إجمالي" : "total"}
          </Badge>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {statItems.map(({ icon: Icon, value, label, color, bg, ring }, i) => (
            <div
              key={i}
              className={`group rounded-2xl ${bg} ring-1 ${ring} py-3.5 px-2 text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-sm`}
            >
              <div className={`mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-background/60 transition-transform duration-300 group-hover:scale-110`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <p className="text-2xl font-black tabular-nums">{value}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {capacity !== null && (
          <div className="space-y-2.5 rounded-xl bg-muted/20 p-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">{isAr ? "السعة" : "Capacity"}</span>
              <span className="font-bold tabular-nums text-foreground">{stats.approved}/{maxParticipants}</span>
            </div>
            <Progress value={Math.min(capacity, 100)} className="h-2.5 rounded-full" />
            {capacity >= 90 && (
              <p className="flex items-center gap-1.5 text-[11px] text-destructive font-semibold">
                <AlertTriangle className="h-3 w-3" />
                {isAr ? "اقتربت السعة من الامتلاء!" : "Almost full!"}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
