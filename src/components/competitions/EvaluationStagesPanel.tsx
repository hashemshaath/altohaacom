import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Plus, Layers, Eye, Wrench, Flame, Presentation, GripVertical, Trash2 } from "lucide-react";

interface Props {
  competitionId: string;
  isOrganizer: boolean;
}

const STAGE_TYPES = [
  { value: "visual", en: "Visual", ar: "مرئي", icon: Eye },
  { value: "technical", en: "Technical", ar: "تقني", icon: Wrench },
  { value: "performance", en: "Performance", ar: "أداء", icon: Flame },
  { value: "tasting", en: "Tasting", ar: "تذوق", icon: Flame },
  { value: "presentation", en: "Presentation", ar: "عرض", icon: Presentation },
];

export function EvaluationStagesPanel({ competitionId, isOrganizer }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", name_ar: "", stage_type: "visual", weight_percentage: "100" });

  const { data: stages, isLoading } = useQuery({
    queryKey: ["evaluation-stages", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evaluation_stages")
        .select("*")
        .eq("competition_id", competitionId)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: stageScoreCounts } = useQuery({
    queryKey: ["stage-score-counts", competitionId],
    queryFn: async () => {
      if (!stages?.length) return {};
      const stageIds = stages.map(s => s.id);
      const { data } = await supabase
        .from("stage_scores")
        .select("stage_id")
        .in("stage_id", stageIds);
      const counts: Record<string, number> = {};
      data?.forEach(s => { counts[s.stage_id] = (counts[s.stage_id] || 0) + 1; });
      return counts;
    },
    enabled: !!stages?.length,
  });

  const createStage = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("evaluation_stages").insert({
        competition_id: competitionId,
        name: form.name,
        name_ar: form.name_ar || undefined,
        stage_type: form.stage_type,
        weight_percentage: parseFloat(form.weight_percentage) || 100,
        sort_order: (stages?.length || 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-stages", competitionId] });
      setShowCreate(false);
      setForm({ name: "", name_ar: "", stage_type: "visual", weight_percentage: "100" });
      toast({ title: isAr ? "تمت إضافة المرحلة" : "Stage added" });
    },
    onError: () => toast({ title: isAr ? "خطأ" : "Error", variant: "destructive" }),
  });

  const deleteStage = useMutation({
    mutationFn: async (stageId: string) => {
      const { error } = await supabase.from("evaluation_stages").delete().eq("id", stageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-stages", competitionId] });
      toast({ title: isAr ? "تم الحذف" : "Deleted" });
    },
  });

  if (isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;

  const totalWeight = stages?.reduce((sum, s) => sum + (Number(s.weight_percentage) || 0), 0) || 0;
  const weightValid = Math.abs(totalWeight - 100) < 0.01;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/10">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{isAr ? "مراحل التقييم" : "Evaluation Stages"}</h3>
            <p className="text-xs text-muted-foreground">{isAr ? "تقييم متعدد المراحل" : "Multi-stage evaluation pipeline"}</p>
          </div>
        </div>
        {isOrganizer && (
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="me-1.5 h-4 w-4" />{isAr ? "مرحلة" : "Add Stage"}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isAr ? "إضافة مرحلة تقييم" : "Add Evaluation Stage"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{isAr ? "الاسم (إنجليزي)" : "Name (EN)"}</Label>
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Visual Inspection" />
                  </div>
                  <div>
                    <Label>{isAr ? "الاسم (عربي)" : "Name (AR)"}</Label>
                    <Input value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))} dir="rtl" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{isAr ? "النوع" : "Type"}</Label>
                    <Select value={form.stage_type} onValueChange={v => setForm(f => ({ ...f, stage_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STAGE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{isAr ? "الوزن %" : "Weight %"}</Label>
                    <Input type="number" value={form.weight_percentage} onChange={e => setForm(f => ({ ...f, weight_percentage: e.target.value }))} min="0" max="100" />
                  </div>
                </div>
                <Button onClick={() => createStage.mutate()} disabled={!form.name || createStage.isPending}>
                  {createStage.isPending ? "..." : (isAr ? "إضافة" : "Add Stage")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Weight indicator */}
      {stages && stages.length > 0 && (
        <div className="flex items-center gap-3">
          <Progress value={Math.min(totalWeight, 100)} className="flex-1 h-2" />
          <Badge variant={weightValid ? "default" : "destructive"} className="text-[10px] shrink-0">
            {totalWeight.toFixed(0)}% / 100%
          </Badge>
        </div>
      )}

      {!stages?.length ? (
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Layers className="h-10 w-10 text-muted-foreground/20 mb-3" />
            <p className="font-medium text-sm">{isAr ? "لا توجد مراحل" : "No stages configured"}</p>
            <p className="text-xs text-muted-foreground mt-1">{isAr ? "أضف مراحل التقييم المتعددة" : "Add evaluation stages for multi-phase judging"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {stages.map((stage, idx) => {
            const StageIcon = STAGE_TYPES.find(t => t.value === stage.stage_type)?.icon || Layers;
            const typeLabel = STAGE_TYPES.find(t => t.value === stage.stage_type);
            const scoreCount = stageScoreCounts?.[stage.id] || 0;

            return (
              <Card key={stage.id} className="border-border/50 transition-all hover:shadow-sm hover:border-primary/20">
                <CardContent className="flex items-center gap-3 p-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 ring-1 ring-primary/10 shrink-0">
                    <StageIcon className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{isAr && stage.name_ar ? stage.name_ar : stage.name}</span>
                      <Badge variant="outline" className="text-[10px]">{typeLabel ? (isAr ? typeLabel.ar : typeLabel.en) : stage.stage_type}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                      <span>{isAr ? "الوزن" : "Weight"}: <strong>{Number(stage.weight_percentage).toFixed(0)}%</strong></span>
                      {scoreCount > 0 && <span>{scoreCount} {isAr ? "تقييم" : "scores"}</span>}
                    </div>
                  </div>
                  {isOrganizer && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteStage.mutate(stage.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
