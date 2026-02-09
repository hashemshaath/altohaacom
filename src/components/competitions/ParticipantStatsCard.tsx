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
    <Card className="overflow-hidden">
      <div className="border-b bg-muted/30 px-4 py-3">
        <h3 className="flex items-center gap-2 font-semibold text-sm">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
            <Users className="h-3.5 w-3.5 text-primary" />
          </div>
          {isAr ? "إحصائيات المشاركين" : "Participant Stats"}
        </h3>
      </div>
      <CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-chart-5/10 py-2">
            <CheckCircle className="mx-auto h-3.5 w-3.5 text-chart-5 mb-0.5" />
            <p className="text-lg font-bold">{stats.approved}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "مقبول" : "Approved"}</p>
          </div>
          <div className="rounded-lg bg-chart-4/10 py-2">
            <Clock className="mx-auto h-3.5 w-3.5 text-chart-4 mb-0.5" />
            <p className="text-lg font-bold">{stats.pending}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "معلق" : "Pending"}</p>
          </div>
          <div className="rounded-lg bg-destructive/10 py-2">
            <XCircle className="mx-auto h-3.5 w-3.5 text-destructive mb-0.5" />
            <p className="text-lg font-bold">{stats.rejected}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "مرفوض" : "Rejected"}</p>
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
