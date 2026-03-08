import { useState, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Plus, Trophy, Users, ArrowRight, ChevronDown, ChevronUp, Play, CheckCircle, Clock, Swords } from "lucide-react";

interface Props {
  competitionId: string;
  isOrganizer: boolean;
}

const ROUND_TYPES = [
  { value: "preliminary", en: "Preliminary", ar: "تمهيدية" },
  { value: "quarterfinal", en: "Quarter-Final", ar: "ربع النهائي" },
  { value: "semifinal", en: "Semi-Final", ar: "نصف النهائي" },
  { value: "final", en: "Final", ar: "النهائي" },
];

const FORMATS = [
  { value: "scored", en: "Scored", ar: "بالنقاط" },
  { value: "elimination", en: "Elimination", ar: "إقصائي" },
  { value: "bracket", en: "Bracket", ar: "أقواس" },
];

const ADVANCEMENT_RULES = [
  { value: "top_scores", en: "Top Scores", ar: "أعلى النقاط" },
  { value: "threshold", en: "Score Threshold", ar: "حد أدنى للنقاط" },
  { value: "manual", en: "Manual Selection", ar: "اختيار يدوي" },
];

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3.5 w-3.5" />,
  in_progress: <Play className="h-3.5 w-3.5" />,
  completed: <CheckCircle className="h-3.5 w-3.5" />,
};

const statusStyles: Record<string, string> = {
  pending: "bg-muted/60 text-muted-foreground",
  in_progress: "bg-chart-3/10 text-chart-3",
  completed: "bg-chart-5/10 text-chart-5",
};

export function TournamentRoundsPanel({ competitionId, isOrganizer }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "", name_ar: "", round_type: "preliminary", format: "scored",
    advancement_count: "", advancement_rule: "top_scores", threshold_score: "",
    max_participants: "",
  });

  const { data: rounds, isLoading } = useQuery({
    queryKey: ["competition-rounds", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_rounds")
        .select("id, competition_id, name, name_ar, round_number, round_type, format, status, sort_order, start_time, end_time, advancement_count, advancement_rule, threshold_score, max_participants")
        .eq("competition_id", competitionId)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: roundParticipants } = useQuery({
    queryKey: ["round-participants", competitionId],
    queryFn: async () => {
      if (!rounds?.length) return {};
      const roundIds = rounds.map(r => r.id);
      const { data, error } = await supabase
        .from("round_participants")
        .select("*, competition_registrations:registration_id(participant_id, dish_name, profiles:participant_id(full_name, full_name_ar, avatar_url))")
        .in("round_id", roundIds);
      if (error) throw error;
      const grouped: Record<string, typeof data> = {};
      data?.forEach(rp => {
        if (!grouped[rp.round_id]) grouped[rp.round_id] = [];
        grouped[rp.round_id].push(rp);
      });
      return grouped;
    },
    enabled: !!rounds?.length,
  });

  const createRound = useMutation({
    mutationFn: async () => {
      const nextOrder = (rounds?.length || 0) + 1;
      const { error } = await supabase.from("competition_rounds").insert({
        competition_id: competitionId,
        name: form.name || `Round ${nextOrder}`,
        name_ar: form.name_ar || undefined,
        round_number: nextOrder,
        round_type: form.round_type,
        format: form.format,
        advancement_count: form.advancement_count ? parseInt(form.advancement_count) : null,
        advancement_rule: form.advancement_rule,
        threshold_score: form.threshold_score ? parseFloat(form.threshold_score) : null,
        max_participants: form.max_participants ? parseInt(form.max_participants) : null,
        sort_order: nextOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition-rounds", competitionId] });
      setShowCreate(false);
      setForm({ name: "", name_ar: "", round_type: "preliminary", format: "scored", advancement_count: "", advancement_rule: "top_scores", threshold_score: "", max_participants: "" });
      toast({ title: isAr ? "تمت إضافة الجولة" : "Round added" });
    },
    onError: () => toast({ title: isAr ? "خطأ" : "Error", variant: "destructive" }),
  });

  const updateRoundStatus = useMutation({
    mutationFn: async ({ roundId, status }: { roundId: string; status: string }) => {
      const { error } = await supabase.from("competition_rounds").update({ status }).eq("id", roundId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition-rounds", competitionId] });
      toast({ title: isAr ? "تم التحديث" : "Updated" });
    },
  });

  if (isLoading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>;
  }

  const getLabel = (arr: { value: string; en: string; ar: string }[], val: string) => {
    const item = arr.find(a => a.value === val);
    return item ? (isAr ? item.ar : item.en) : val;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/10">
            <Swords className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{isAr ? "جولات البطولة" : "Tournament Rounds"}</h3>
            <p className="text-xs text-muted-foreground">{isAr ? "إدارة الجولات والتأهل" : "Manage rounds & advancement"}</p>
          </div>
        </div>
        {isOrganizer && (
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="me-1.5 h-4 w-4" />{isAr ? "جولة جديدة" : "Add Round"}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{isAr ? "إضافة جولة جديدة" : "Add New Round"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{isAr ? "الاسم (إنجليزي)" : "Name (EN)"}</Label>
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Semi-Final" />
                  </div>
                  <div>
                    <Label>{isAr ? "الاسم (عربي)" : "Name (AR)"}</Label>
                    <Input value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))} placeholder="نصف النهائي" dir="rtl" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{isAr ? "نوع الجولة" : "Round Type"}</Label>
                    <Select value={form.round_type} onValueChange={v => setForm(f => ({ ...f, round_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROUND_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{isAr ? "التنسيق" : "Format"}</Label>
                    <Select value={form.format} onValueChange={v => setForm(f => ({ ...f, format: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FORMATS.map(t => <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>{isAr ? "قاعدة التأهل" : "Advancement"}</Label>
                    <Select value={form.advancement_rule} onValueChange={v => setForm(f => ({ ...f, advancement_rule: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ADVANCEMENT_RULES.map(t => <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{isAr ? "عدد المتأهلين" : "Advance #"}</Label>
                    <Input type="number" value={form.advancement_count} onChange={e => setForm(f => ({ ...f, advancement_count: e.target.value }))} placeholder="e.g. 8" />
                  </div>
                  <div>
                    <Label>{isAr ? "الحد الأقصى" : "Max"}</Label>
                    <Input type="number" value={form.max_participants} onChange={e => setForm(f => ({ ...f, max_participants: e.target.value }))} />
                  </div>
                </div>
                {form.advancement_rule === "threshold" && (
                  <div>
                    <Label>{isAr ? "الحد الأدنى للنقاط" : "Threshold Score"}</Label>
                    <Input type="number" value={form.threshold_score} onChange={e => setForm(f => ({ ...f, threshold_score: e.target.value }))} />
                  </div>
                )}
                <Button onClick={() => createRound.mutate()} disabled={createRound.isPending}>
                  {createRound.isPending ? (isAr ? "جارٍ الإضافة..." : "Adding...") : (isAr ? "إضافة الجولة" : "Add Round")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!rounds?.length ? (
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Swords className="h-10 w-10 text-muted-foreground/20 mb-3" />
            <p className="font-medium text-sm">{isAr ? "لا توجد جولات بعد" : "No rounds configured"}</p>
            <p className="text-xs text-muted-foreground mt-1">{isAr ? "أضف جولات لتفعيل نظام البطولة" : "Add rounds to enable tournament mode"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute start-6 top-0 bottom-0 w-px bg-border/60 hidden md:block" />

          <div className="space-y-3">
            {rounds.map((round, idx) => {
              const participants = roundParticipants?.[round.id] || [];
              const advancedCount = participants.filter(p => p.status === "advanced").length;
              const eliminatedCount = participants.filter(p => p.status === "eliminated").length;

              return (
                <Card key={round.id} className="relative overflow-hidden border-border/50 transition-all hover:shadow-md hover:border-primary/20">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-background text-sm font-bold text-primary shrink-0">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-sm">{isAr && round.name_ar ? round.name_ar : round.name}</h4>
                            <Badge className={`${statusStyles[round.status]} text-[10px] gap-1`}>
                              {statusIcons[round.status]}
                              {round.status === "pending" ? (isAr ? "معلقة" : "Pending") :
                               round.status === "in_progress" ? (isAr ? "جارية" : "In Progress") :
                               (isAr ? "مكتملة" : "Completed")}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">{getLabel(ROUND_TYPES, round.round_type)}</Badge>
                            <Badge variant="outline" className="text-[10px]">{getLabel(FORMATS, round.format)}</Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {participants.length} {isAr ? "مشارك" : "participants"}
                            </span>
                            {round.advancement_count && (
                              <span className="flex items-center gap-1">
                                <ArrowRight className="h-3 w-3 text-chart-5" />
                                {isAr ? `${round.advancement_count} يتأهلون` : `${round.advancement_count} advance`}
                              </span>
                            )}
                            {advancedCount > 0 && (
                              <span className="flex items-center gap-1 text-chart-5">
                                <ChevronUp className="h-3 w-3" />
                                {advancedCount} {isAr ? "تأهلوا" : "advanced"}
                              </span>
                            )}
                            {eliminatedCount > 0 && (
                              <span className="flex items-center gap-1 text-destructive">
                                <ChevronDown className="h-3 w-3" />
                                {eliminatedCount} {isAr ? "أُقصوا" : "eliminated"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isOrganizer && round.status !== "completed" && (
                        <div className="flex gap-1.5">
                          {round.status === "pending" && (
                            <Button size="sm" variant="outline" onClick={() => updateRoundStatus.mutate({ roundId: round.id, status: "in_progress" })}>
                              <Play className="me-1 h-3 w-3" />{isAr ? "بدء" : "Start"}
                            </Button>
                          )}
                          {round.status === "in_progress" && (
                            <Button size="sm" variant="outline" onClick={() => updateRoundStatus.mutate({ roundId: round.id, status: "completed" })}>
                              <CheckCircle className="me-1 h-3 w-3" />{isAr ? "إكمال" : "Complete"}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
