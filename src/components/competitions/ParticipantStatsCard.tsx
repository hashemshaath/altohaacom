import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
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

  return (
    <Card className="overflow-hidden border-border/50 transition-all duration-300 hover:shadow-md hover:border-primary/20 group">
      <div className="bg-gradient-to-r from-muted/50 to-transparent px-5 py-3 border-b border-border/40">
        <h3 className="flex items-center gap-2.5 font-bold text-[11px] uppercase tracking-wider text-muted-foreground">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/5 ring-1 ring-primary/10 transition-transform group-hover:scale-110">
            <Users className="h-4 w-4 text-primary" />
          </div>
          {isAr ? "إحصائيات المشاركين" : "Participant Stats"}
        </h3>
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-chart-5/5 border border-chart-5/10 py-3 transition-colors hover:bg-chart-5/10">
            <CheckCircle className="mx-auto h-4 w-4 text-chart-5 mb-1" />
            <p className="text-xl font-bold tabular-nums">{stats.approved}</p>
            <p className="text-[10px] uppercase font-medium text-muted-foreground">{isAr ? "مقبول" : "Approved"}</p>
          </div>
          <div className="rounded-xl bg-chart-4/5 border border-chart-4/10 py-3 transition-colors hover:bg-chart-4/10">
            <Clock className="mx-auto h-4 w-4 text-chart-4 mb-1" />
            <p className="text-xl font-bold tabular-nums">{stats.pending}</p>
            <p className="text-[10px] uppercase font-medium text-muted-foreground">{isAr ? "معلق" : "Pending"}</p>
          </div>
          <div className="rounded-xl bg-destructive/5 border border-destructive/10 py-3 transition-colors hover:bg-destructive/10">
            <XCircle className="mx-auto h-4 w-4 text-destructive mb-1" />
            <p className="text-xl font-bold tabular-nums">{stats.rejected}</p>
            <p className="text-[10px] uppercase font-medium text-muted-foreground">{isAr ? "مرفوض" : "Rejected"}</p>
          </div>

        </div>

        {capacity !== null && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{isAr ? "السعة" : "Capacity"}</span>
              <span className="font-medium">{stats.approved}/{maxParticipants}</span>
            </div>
            <Progress value={Math.min(capacity, 100)} className="h-2" />
            {capacity >= 90 && (
              <p className="text-[10px] text-destructive font-medium">
                {isAr ? "اقتربت السعة من الامتلاء!" : "Almost full!"}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
