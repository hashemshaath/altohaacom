import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Calendar, Clock, MapPin, Plus, AlertTriangle, ChevronDown, ChevronUp,
  Users, Utensils, CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";

interface Props {
  competitionId: string;
  language: string;
  isOrganizer?: boolean;
}

interface ScheduleEvent {
  id: string;
  title: string;
  title_ar?: string;
  event_type: string;
  start_time: string;
  end_time?: string;
  location?: string;
  location_ar?: string;
  assigned_staff?: string[];
  notes?: string;
  status: string;
}

export function AdvancedSchedulingPanel({ competitionId, language, isOrganizer }: Props) {
  const isAr = language === "ar";
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);

  const { data: rounds = [], isLoading } = useQuery({
    queryKey: ["comp-schedule-rounds", competitionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("competition_rounds")
        .select("id, competition_id, name, name_ar, round_number, round_type, format, status, sort_order, start_time, end_time, advancement_count, max_participants")
        .eq("competition_id", competitionId)
        .order("round_number", { ascending: true });
      return data || [];
    },
    enabled: !!competitionId,
  });

  const { data: stations = [] } = useQuery({
    queryKey: ["comp-schedule-stations", competitionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("kitchen_stations")
        .select("id, competition_id, station_number, station_name, station_name_ar, status, equipment_list, assigned_registration_id, assigned_slot_id, created_at")
        .eq("competition_id", competitionId)
        .order("station_number", { ascending: true });
      return data || [];
    },
    enabled: !!competitionId,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["comp-schedule-cats", competitionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("competition_categories")
        .select("id, name, name_ar")
        .eq("competition_id", competitionId);
      return data || [];
    },
    enabled: !!competitionId,
  });

  // Conflict detection
  const conflicts = detectConflicts(rounds, stations);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">{isAr ? "الجدول الزمني المتقدم" : "Advanced Schedule"}</h3>
          <Badge variant="outline" className="text-[10px]">
            {rounds.length} {isAr ? "جولة" : "rounds"} · {stations.length} {isAr ? "محطة" : "stations"}
          </Badge>
        </div>
      </div>

      {/* Conflict Alerts */}
      {conflicts.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-destructive">
                  {isAr ? "تم اكتشاف تعارضات" : "Conflicts Detected"}
                </p>
                <ul className="mt-1 space-y-1">
                  {conflicts.map((c, i) => (
                    <li key={i} className="text-xs text-muted-foreground">• {c}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline View */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : rounds.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              {isAr ? "لم يتم إعداد جولات بعد" : "No rounds configured yet"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isAr ? "أضف جولات من تبويب إدارة الجولات" : "Add rounds from the Tournament Rounds tab"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute start-5 top-0 bottom-0 w-0.5 bg-border" />
          
          <div className="space-y-4">
            {rounds.map((round: any, idx: number) => (
              <div key={round.id} className="relative ps-12">
                {/* Timeline dot */}
                <div className={`absolute start-3 top-4 h-4 w-4 rounded-full border-2 ${
                  round.status === "completed" ? "bg-chart-3 border-chart-3" :
                  round.status === "in_progress" ? "bg-primary border-primary animate-pulse" :
                  "bg-background border-border"
                }`} />
                
                <Card className="transition-all hover:shadow-sm">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-semibold">
                            {isAr && round.name_ar ? round.name_ar : round.name || `Round ${round.round_number}`}
                          </h4>
                          <Badge variant="outline" className="text-[10px]">
                            {isAr ? `جولة ${round.round_number}` : `Round ${round.round_number}`}
                          </Badge>
                          <RoundStatusBadge status={round.status} isAr={isAr} />
                        </div>
                        
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {round.start_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(round.start_time), "MMM d, HH:mm")}
                              {round.end_time && ` - ${format(new Date(round.end_time), "HH:mm")}`}
                            </span>
                          )}
                          {round.max_participants && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {isAr ? `${round.max_participants} مشارك` : `${round.max_participants} participants`}
                            </span>
                          )}
                        </div>

                        {round.description && (
                          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                            {isAr && round.description_ar ? round.description_ar : round.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resource Allocation */}
      {stations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Utensils className="h-4 w-4 text-chart-4" />
              {isAr ? "تخصيص المحطات" : "Station Allocation"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {stations.map((station: any) => (
                <div
                  key={station.id}
                  className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold ${
                    station.status === "occupied" ? "bg-chart-4/10 text-chart-4" :
                    station.status === "maintenance" ? "bg-destructive/10 text-destructive" :
                    "bg-chart-3/10 text-chart-3"
                  }`}>
                    {station.station_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {isAr && station.name_ar ? station.name_ar : station.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground capitalize">{station.status || "available"}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RoundStatusBadge({ status, isAr }: { status: string; isAr: boolean }) {
  const map: Record<string, { label: string; labelAr: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "Pending", labelAr: "قيد الانتظار", variant: "secondary" },
    in_progress: { label: "In Progress", labelAr: "جارية", variant: "default" },
    completed: { label: "Completed", labelAr: "مكتملة", variant: "outline" },
  };
  const s = map[status] || map.pending;
  return <Badge variant={s.variant} className="text-[10px]">{isAr ? s.labelAr : s.label}</Badge>;
}

function detectConflicts(rounds: any[], stations: any[]): string[] {
  const conflicts: string[] = [];
  
  // Check for overlapping rounds
  for (let i = 0; i < rounds.length; i++) {
    for (let j = i + 1; j < rounds.length; j++) {
      if (rounds[i].start_time && rounds[j].start_time && rounds[i].end_time && rounds[j].end_time) {
        const s1 = new Date(rounds[i].start_time).getTime();
        const e1 = new Date(rounds[i].end_time).getTime();
        const s2 = new Date(rounds[j].start_time).getTime();
        const e2 = new Date(rounds[j].end_time).getTime();
        if (s1 < e2 && s2 < e1) {
          conflicts.push(`Round ${rounds[i].round_number} overlaps with Round ${rounds[j].round_number}`);
        }
      }
    }
  }

  // Check station capacity
  const overloaded = stations.filter((s: any) => s.status === "maintenance");
  if (overloaded.length > 0) {
    conflicts.push(`${overloaded.length} station(s) under maintenance`);
  }

  return conflicts;
}
