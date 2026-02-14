import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { toEnglishDigits } from "@/lib/formatNumber";
import {
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  GripVertical,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface CriteriaManagementPanelProps {
  competitionId: string;
  isOrganizer?: boolean;
}

interface CriterionForm {
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  max_score: number;
  weight: number;
}

const EMPTY_FORM: CriterionForm = {
  name: "",
  name_ar: "",
  description: "",
  description_ar: "",
  max_score: 10,
  weight: 0.2,
};

export function CriteriaManagementPanel({
  competitionId,
  isOrganizer,
}: CriteriaManagementPanelProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<CriterionForm>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: criteria, isLoading } = useQuery({
    queryKey: ["judging-criteria", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("judging_criteria")
        .select("*")
        .eq("competition_id", competitionId)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!competitionId,
  });

  const totalWeight = criteria?.reduce((sum, c) => {
    if (editingId === c.id) return sum;
    return sum + Number(c.weight);
  }, 0) || 0;

  const currentFormWeight = editingId || isAdding ? form.weight : 0;
  const projectedTotalWeight = totalWeight + currentFormWeight;

  const saveMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id?: string;
      data: CriterionForm & { competition_id: string; sort_order: number };
    }) => {
      if (id) {
        const { error } = await supabase
          .from("judging_criteria")
          .update(data)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("judging_criteria").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["judging-criteria", competitionId] });
      toast({ title: isAr ? "تم الحفظ" : "Saved successfully" });
      resetForm();
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("judging_criteria").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["judging-criteria", competitionId] });
      toast({ title: isAr ? "تم الحذف" : "Criterion deleted" });
      setDeleteConfirm(null);
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setIsAdding(false);
  };

  const startEdit = (crit: any) => {
    setForm({
      name: crit.name || "",
      name_ar: crit.name_ar || "",
      description: crit.description || "",
      description_ar: crit.description_ar || "",
      max_score: crit.max_score || 10,
      weight: Number(crit.weight) || 0.2,
    });
    setEditingId(crit.id);
    setIsAdding(false);
  };

  const startAdd = () => {
    resetForm();
    setIsAdding(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast({ variant: "destructive", title: isAr ? "الاسم مطلوب" : "Name is required" });
      return;
    }
    saveMutation.mutate({
      id: editingId || undefined,
      data: {
        ...form,
        competition_id: competitionId,
        sort_order: editingId
          ? (criteria?.find((c) => c.id === editingId)?.sort_order || 0)
          : (criteria?.length || 0) + 1,
      },
    });
  };

  const renderForm = () => (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">
            {editingId
              ? (isAr ? "تعديل المعيار" : "Edit Criterion")
              : (isAr ? "إضافة معيار جديد" : "Add New Criterion")}
          </h4>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetForm}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "الاسم (إنجليزي)" : "Name (English)"}</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g., Presentation"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "الاسم (عربي)" : "Name (Arabic)"}</Label>
            <Input
              value={form.name_ar}
              onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))}
              placeholder="مثال: العرض التقديمي"
              className="h-8 text-sm"
              dir="rtl"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "الوصف (إنجليزي)" : "Description (English)"}</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Describe what judges should evaluate..."
              className="text-sm min-h-[60px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "الوصف (عربي)" : "Description (Arabic)"}</Label>
            <Textarea
              value={form.description_ar}
              onChange={(e) => setForm((f) => ({ ...f, description_ar: e.target.value }))}
              placeholder="وصف ما يجب على الحكام تقييمه..."
              className="text-sm min-h-[60px]"
              dir="rtl"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs">
              {isAr ? "الدرجة القصوى" : "Max Score"}: <span className="font-bold">{form.max_score}</span>
            </Label>
            <Slider
              value={[form.max_score]}
              onValueChange={([v]) => setForm((f) => ({ ...f, max_score: v }))}
              min={1}
              max={100}
              step={1}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">
              {isAr ? "الوزن" : "Weight"}: <span className="font-bold">{toEnglishDigits((form.weight * 100).toFixed(0))}%</span>
            </Label>
            <Slider
              value={[form.weight * 100]}
              onValueChange={([v]) => setForm((f) => ({ ...f, weight: v / 100 }))}
              min={1}
              max={100}
              step={1}
            />
          </div>
        </div>

        {/* Weight warning */}
        {Math.abs(projectedTotalWeight - 1) > 0.01 && (
          <div className="flex items-center gap-2 rounded-md bg-chart-4/10 px-3 py-2 text-xs text-chart-4">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {isAr
              ? `مجموع الأوزان: ${toEnglishDigits((projectedTotalWeight * 100).toFixed(0))}% (يجب أن يكون 100%)`
              : `Total weight: ${toEnglishDigits((projectedTotalWeight * 100).toFixed(0))}% (should be 100%)`}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={resetForm}>
            {isAr ? "إلغاء" : "Cancel"}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin me-1" />
            ) : (
              <Save className="h-4 w-4 me-1" />
            )}
            {isAr ? "حفظ" : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="overflow-hidden">
        <div className="border-b bg-muted/30 px-4 py-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold text-sm">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-chart-3/10">
              <ClipboardList className="h-3.5 w-3.5 text-chart-3" />
            </div>
            {isAr ? "معايير التحكيم" : "Judging Criteria"}
            <Badge variant="secondary" className="ms-1">{criteria?.length || 0}</Badge>
          </h3>
          {isOrganizer && !isAdding && !editingId && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={startAdd}>
              <Plus className="h-3 w-3 me-1" />
              {isAr ? "إضافة" : "Add Criterion"}
            </Button>
          )}
        </div>

        {/* Total weight indicator */}
        {criteria && criteria.length > 0 && (
          <div className="px-4 py-2 border-b bg-muted/10 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {isAr ? "مجموع الأوزان" : "Total Weight"}
            </span>
            <Badge
              variant="outline"
              className={
                Math.abs(
                  criteria.reduce((s, c) => s + Number(c.weight), 0) - 1
                ) < 0.01
                  ? "text-chart-5"
                  : "text-chart-4"
              }
            >
              {toEnglishDigits((criteria.reduce((s, c) => s + Number(c.weight), 0) * 100).toFixed(0))}%
            </Badge>
          </div>
        )}

        <CardContent className="p-4 space-y-3">
          {/* Add form */}
          {isAdding && renderForm()}

          {/* Criteria list */}
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-lg bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : criteria && criteria.length > 0 ? (
            <div className="space-y-2">
              {criteria.map((crit) =>
                editingId === crit.id ? (
                  <div key={crit.id}>{renderForm()}</div>
                ) : (
                  <div
                    key={crit.id}
                    className="group flex items-start gap-3 rounded-lg border p-3 hover:bg-accent/20 transition-colors"
                  >
                    {isOrganizer && (
                      <GripVertical className="h-4 w-4 text-muted-foreground/30 mt-0.5 shrink-0" />
                    )}
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary shrink-0">
                      {toEnglishDigits((Number(crit.weight) * 100).toFixed(0))}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {isAr && crit.name_ar ? crit.name_ar : crit.name}
                      </p>
                      {(crit.description || crit.description_ar) && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                          {isAr && crit.description_ar ? crit.description_ar : crit.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-[10px]">
                        {isAr ? "الأقصى" : "Max"}: {crit.max_score}
                      </Badge>
                      {isOrganizer && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => startEdit(crit)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          {deleteConfirm === crit.id ? (
                            <div className="flex gap-1">
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => deleteMutation.mutate(crit.id)}
                                disabled={deleteMutation.isPending}
                              >
                                {deleteMutation.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setDeleteConfirm(null)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => setDeleteConfirm(crit.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted/60 text-muted-foreground/50">
                <ClipboardList className="h-6 w-6" />
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                {isAr ? "لم يتم تحديد معايير بعد" : "No judging criteria defined yet."}
              </p>
              {isOrganizer && (
                <Button size="sm" className="mt-3" onClick={startAdd}>
                  <Plus className="h-3.5 w-3.5 me-1" />
                  {isAr ? "إضافة أول معيار" : "Add First Criterion"}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
