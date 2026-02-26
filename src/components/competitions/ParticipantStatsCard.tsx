import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Progress } from "@/components/ui/progress";
import { Users, CheckCircle, Clock, XCircle } from "lucide-react";

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
    { icon: CheckCircle, value: stats.approved, label: isAr ? "مقبول" : "Approved", color: "text-chart-5", bg: "bg-chart-5/8" },
    { icon: Clock, value: stats.pending, label: isAr ? "معلق" : "Pending", color: "text-chart-4", bg: "bg-chart-4/8" },
    { icon: XCircle, value: stats.rejected, label: isAr ? "مرفوض" : "Rejected", color: "text-destructive", bg: "bg-destructive/8" },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-border/40 bg-card">
      <div className="border-b border-border/30 bg-gradient-to-r from-muted/30 to-transparent px-5 py-3.5">
        <h3 className="flex items-center gap-2.5 font-bold text-sm">
          <Users className="h-4 w-4 text-primary" />
          {isAr ? "إحصائيات المشاركين" : "Participant Stats"}
        </h3>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-3 gap-2.5">
          {statItems.map(({ icon: Icon, value, label, color, bg }, i) => (
            <div key={i} className={`rounded-xl ${bg} py-3.5 text-center transition-all hover:scale-[1.02]`}>
              <Icon className={`mx-auto h-4 w-4 ${color} mb-1.5`} />
              <p className="text-2xl font-bold tabular-nums">{value}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {capacity !== null && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">{isAr ? "السعة" : "Capacity"}</span>
              <span className="font-bold tabular-nums">{stats.approved}/{maxParticipants}</span>
            </div>
            <Progress value={Math.min(capacity, 100)} className="h-2.5 rounded-full" />
            {capacity >= 90 && (
              <p className="text-[11px] text-destructive font-semibold">
                {isAr ? "اقتربت السعة من الامتلاء!" : "Almost full!"}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
