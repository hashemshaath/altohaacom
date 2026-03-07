import { useState, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Medal, Award, Calendar, Search, Filter, ArrowRight, Clock, CheckCircle2, XCircle, Loader2, ChevronRight, Eye } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface CompetitionHistoryProps {
  userId: string;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string; labelAr: string }> = {
  pending: { icon: Clock, color: "text-chart-4", bg: "bg-chart-4/10", label: "Pending", labelAr: "معلق" },
  approved: { icon: CheckCircle2, color: "text-chart-2", bg: "bg-chart-2/10", label: "Approved", labelAr: "مقبول" },
  rejected: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Rejected", labelAr: "مرفوض" },
  withdrawn: { icon: XCircle, color: "text-muted-foreground", bg: "bg-muted", label: "Withdrawn", labelAr: "منسحب" },
};

const COMP_STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; labelAr: string }> = {
  completed: { color: "text-chart-5", bg: "bg-chart-5/10", label: "Completed", labelAr: "مكتمل" },
  in_progress: { color: "text-chart-3", bg: "bg-chart-3/10", label: "In Progress", labelAr: "قيد التنفيذ" },
  judging: { color: "text-chart-4", bg: "bg-chart-4/10", label: "Judging", labelAr: "تحكيم" },
  upcoming: { color: "text-primary", bg: "bg-primary/10", label: "Upcoming", labelAr: "قادم" },
  registration_open: { color: "text-chart-2", bg: "bg-chart-2/10", label: "Open", labelAr: "مفتوح" },
};

export const CompetitionHistory = memo(function CompetitionHistory({ userId }: CompetitionHistoryProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: registrations, isLoading } = useQuery({
    queryKey: ["user-competition-history", userId],
    queryFn: async () => {
      const { data: regs, error } = await supabase
        .from("competition_registrations")
        .select("id, status, registered_at, competition_id, category_id")
        .eq("participant_id", userId)
        .order("registered_at", { ascending: false });

      if (error) throw error;
      if (!regs || regs.length === 0) return [];

      const competitionIds = [...new Set(regs.map(r => r.competition_id))];
      const { data: competitions } = await supabase
        .from("competitions")
        .select("id, title, title_ar, status, competition_start, cover_image_url, country_code")
        .in("id", competitionIds);

      const registrationIds = regs.map(r => r.id);
      const { data: scores } = await supabase
        .from("competition_scores")
        .select("registration_id, score, criteria_id")
        .in("registration_id", registrationIds);

      const competitionMap = new Map(competitions?.map(c => [c.id, c]) || []);

      return regs.map(reg => {
        const competition = competitionMap.get(reg.competition_id);
        const regScores = scores?.filter(s => s.registration_id === reg.id) || [];
        const totalScore = regScores.reduce((sum, s) => sum + Number(s.score), 0);
        return { ...reg, competition, totalScore: regScores.length > 0 ? totalScore : null, hasScores: regScores.length > 0 };
      }).filter(r => r.competition);
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!registrations || registrations.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-2 ring-primary/10">
          <Trophy className="h-7 w-7 text-primary/50" />
        </div>
        <h3 className="text-lg font-bold">{isAr ? "لا توجد مسابقات بعد" : "No Competitions Yet"}</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
          {isAr ? "سجل في مسابقة للبدء في رحلتك التنافسية" : "Register for a competition to start your competitive journey"}
        </p>
        <Link to="/competitions">
          <Button className="mt-4 gap-2">
            <Trophy className="h-4 w-4" />
            {isAr ? "استعرض المسابقات" : "Browse Competitions"}
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </Button>
        </Link>
      </div>
    );
  }

  // Filter
  const filtered = registrations.filter(reg => {
    if (statusFilter !== "all" && reg.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const title = (isAr ? reg.competition?.title_ar : reg.competition?.title) || reg.competition?.title || "";
      if (!title.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Stats
  const approvedCount = registrations.filter(r => r.status === "approved").length;
  const completedCount = registrations.filter(r => r.competition?.status === "completed").length;
  const avgScore = registrations.filter(r => r.hasScores).reduce((s, r) => s + (r.totalScore || 0), 0) /
    (registrations.filter(r => r.hasScores).length || 1);

  return (
    <div className="space-y-5">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: registrations.length, label: isAr ? "إجمالي" : "Total", icon: Trophy, color: "text-primary", bg: "bg-primary/10" },
          { value: completedCount, label: isAr ? "مكتمل" : "Completed", icon: CheckCircle2, color: "text-chart-5", bg: "bg-chart-5/10" },
          { value: avgScore > 0 ? avgScore.toFixed(1) : "—", label: isAr ? "متوسط" : "Avg Score", icon: Award, color: "text-chart-4", bg: "bg-chart-4/10" },
        ].map((stat, i) => (
          <Card key={i} className="border-border/40">
            <CardContent className="flex items-center gap-2.5 p-3">
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl shrink-0", stat.bg)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums leading-tight">{stat.value}</p>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={isAr ? "بحث في المسابقات..." : "Search competitions..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9 h-9 text-xs"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px] h-9 text-xs">
            <Filter className="h-3 w-3 me-1.5" />
            <SelectValue placeholder={isAr ? "الحالة" : "Status"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
            <SelectItem value="approved">{isAr ? "مقبول" : "Approved"}</SelectItem>
            <SelectItem value="pending">{isAr ? "معلق" : "Pending"}</SelectItem>
            <SelectItem value="rejected">{isAr ? "مرفوض" : "Rejected"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
        {isAr ? `${filtered.length} مسابقة` : `${filtered.length} competition${filtered.length !== 1 ? "s" : ""}`}
      </p>

      {/* Competition Cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((reg) => {
          const status = STATUS_CONFIG[reg.status] || STATUS_CONFIG.pending;
          const compStatus = COMP_STATUS_CONFIG[reg.competition?.status || ""] || { color: "text-muted-foreground", bg: "bg-muted", label: reg.competition?.status || "", labelAr: "" };
          const StatusIcon = status.icon;

          return (
            <Link key={reg.id} to={`/competitions/${reg.competition_id}`} className="group">
              <Card className="overflow-hidden border-border/40 transition-all duration-200 hover:shadow-lg hover:border-primary/20 active:scale-[0.98]">
                {/* Cover */}
                <div className="relative h-28 bg-gradient-to-br from-primary/15 via-accent/10 to-primary/5 overflow-hidden">
                  {reg.competition?.cover_image_url ? (
                    <img src={reg.competition.cover_image_url} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Trophy className="h-8 w-8 text-primary/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

                  {/* Floating badges */}
                  <div className="absolute top-2 end-2 flex gap-1">
                    <Badge className={cn("text-[9px] px-1.5 py-0 border-none shadow-sm", compStatus.bg, compStatus.color)}>
                      {isAr ? compStatus.labelAr : compStatus.label}
                    </Badge>
                  </div>

                  {/* Score badge */}
                  {reg.hasScores && (
                    <div className="absolute bottom-2 end-2 flex items-center gap-1 bg-background/90 backdrop-blur-sm rounded-xl px-2 py-1 shadow-sm border border-border/30">
                      <Award className="h-3 w-3 text-chart-4" />
                      <span className="text-xs font-bold tabular-nums">{reg.totalScore?.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <CardContent className="p-3">
                  <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                    {isAr && reg.competition?.title_ar ? reg.competition.title_ar : reg.competition?.title}
                  </h4>

                  <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {reg.competition?.competition_start && format(new Date(reg.competition.competition_start), "MMM yyyy")}
                    </span>
                    <span className="flex items-center gap-1">
                      <StatusIcon className={cn("h-3 w-3", status.color)} />
                      <span className={status.color}>{isAr ? status.labelAr : status.label}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/30">
                    <span className="text-[10px] text-muted-foreground">
                      {isAr ? "تسجيل:" : "Registered:"} {format(new Date(reg.registered_at), "dd MMM yyyy")}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors rtl:rotate-180" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && search && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          {isAr ? "لا توجد نتائج" : "No results found"}
        </div>
      )}
    </div>
  );
}
