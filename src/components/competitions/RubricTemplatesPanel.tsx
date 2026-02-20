import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  ClipboardList, Plus, Trash2, Save, X, Pencil, ChevronDown, ChevronUp, GripVertical
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface CriterionItem {
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  max_score: number;
  weight: number;
}

interface RubricTemplatesPanelProps {
  competitionId?: string;
  isAdmin?: boolean;
}

export function RubricTemplatesPanel({ competitionId, isAdmin }: RubricTemplatesPanelProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", name_ar: "", description: "", description_ar: "",
    competition_type: "", category_type: "", is_active: true,
    criteria: [] as CriterionItem[],
  });

  const { data: rubrics, isLoading } = useQuery({
    queryKey: ["rubric-templates", competitionId],
    queryFn: async () => {
      let query = supabase
        .from("judging_rubric_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (!isAdmin) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        name_ar: form.name_ar || null,
        description: form.description || null,
        description_ar: form.description_ar || null,
        competition_type: form.competition_type || null,
        category_type: form.category_type || null,
        is_active: form.is_active,
        criteria: form.criteria as any,
        created_by: user?.id,
      };

      if (editingId) {
        const { error } = await supabase.from("judging_rubric_templates").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("judging_rubric_templates").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rubric-templates"] });
      resetForm();
      toast({ title: language === "ar" ? "تم الحفظ" : "Rubric saved" });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "Error", description: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("judging_rubric_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rubric-templates"] });
      toast({ title: language === "ar" ? "تم الحذف" : "Deleted" });
    },
  });

  const applyToCompetitionMutation = useMutation({
    mutationFn: async (rubricId: string) => {
      if (!competitionId) return;
      const rubric = rubrics?.find(r => r.id === rubricId);
      if (!rubric) return;

      const criteriaList = (rubric.criteria as any as CriterionItem[]) || [];

      // Delete existing criteria
      await supabase.from("judging_criteria").delete().eq("competition_id", competitionId);

      // Insert new criteria from template
      if (criteriaList.length > 0) {
        const { error } = await supabase.from("judging_criteria").insert(
          criteriaList.map((c, i) => ({
            competition_id: competitionId,
            name: c.name,
            name_ar: c.name_ar || null,
            description: c.description || null,
            description_ar: c.description_ar || null,
            max_score: c.max_score,
            weight: c.weight,
            sort_order: i,
          }))
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["judging-criteria", competitionId] });
      queryClient.invalidateQueries({ queryKey: ["competition-criteria-knowledge", competitionId] });
      toast({ title: language === "ar" ? "تم تطبيق القالب" : "Template applied to competition" });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "Error", description: err.message }),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: "", name_ar: "", description: "", description_ar: "", competition_type: "", category_type: "", is_active: true, criteria: [] });
  };

  const startEdit = (rubric: any) => {
    setEditingId(rubric.id);
    setForm({
      name: rubric.name, name_ar: rubric.name_ar || "",
      description: rubric.description || "", description_ar: rubric.description_ar || "",
      competition_type: rubric.competition_type || "", category_type: rubric.category_type || "",
      is_active: rubric.is_active ?? true,
      criteria: (rubric.criteria as any as CriterionItem[]) || [],
    });
    setShowForm(true);
  };

  const addCriterion = () => {
    setForm(f => ({
      ...f,
      criteria: [...f.criteria, { name: "", max_score: 10, weight: 0.2 }],
    }));
  };

  const updateCriterion = (index: number, updates: Partial<CriterionItem>) => {
    setForm(f => ({
      ...f,
      criteria: f.criteria.map((c, i) => i === index ? { ...c, ...updates } : c),
    }));
  };

  const removeCriterion = (index: number) => {
    setForm(f => ({ ...f, criteria: f.criteria.filter((_, i) => i !== index) }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5" />
              {language === "ar" ? "قوالب معايير التحكيم" : "Scoring Rubric Templates"}
            </CardTitle>
            <CardDescription>
              {language === "ar" ? "قوالب جاهزة لمعايير التقييم يمكن تطبيقها على المسابقات" : "Pre-built scoring criteria templates to apply to competitions"}
            </CardDescription>
          </div>
          {isAdmin && !showForm && (
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="me-2 h-4 w-4" />
              {language === "ar" ? "قالب جديد" : "New Template"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Form */}
        {showForm && (
          <div className="rounded-lg border p-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Name</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Name (Arabic)</Label>
                <Input dir="rtl" value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">{language === "ar" ? "الوصف" : "Description"}</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{language === "ar" ? "نوع المسابقة" : "Competition Type"}</Label>
                <Input value={form.competition_type} onChange={e => setForm(f => ({ ...f, competition_type: e.target.value }))} placeholder="e.g., pastry, hot kitchen" />
              </div>
            </div>

            <Separator />

            {/* Criteria Builder */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{language === "ar" ? "المعايير" : "Criteria"}</Label>
                <Button variant="outline" size="sm" onClick={addCriterion}>
                  <Plus className="me-1 h-3 w-3" /> {language === "ar" ? "إضافة معيار" : "Add Criterion"}
                </Button>
              </div>
              {form.criteria.map((c, i) => (
                <div key={i} className="rounded border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Input placeholder="Criterion name" value={c.name} onChange={e => updateCriterion(i, { name: e.target.value })} className="flex-1" />
                    <Input placeholder="عربي" dir="rtl" value={c.name_ar || ""} onChange={e => updateCriterion(i, { name_ar: e.target.value })} className="flex-1" />
                    <Input type="number" className="w-20" value={c.max_score} onChange={e => updateCriterion(i, { max_score: Number(e.target.value) })} />
                    <Input type="number" className="w-20" step="0.05" value={c.weight} onChange={e => updateCriterion(i, { weight: Number(e.target.value) })} />
                    <Button variant="ghost" size="icon" onClick={() => removeCriterion(i)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <Input placeholder={language === "ar" ? "الوصف (اختياري)" : "Description (optional)"} value={c.description || ""} onChange={e => updateCriterion(i, { description: e.target.value })} className="text-sm" />
                </div>
              ))}
              {form.criteria.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {language === "ar" ? "المجموع:" : "Total weight:"}{" "}
                  {form.criteria.reduce((s, c) => s + c.weight, 0).toFixed(2)}
                  {form.criteria.reduce((s, c) => s + c.weight, 0) !== 1 && (
                    <span className="text-destructive ms-2">({language === "ar" ? "يجب أن يكون 1.0" : "should be 1.0"})</span>
                  )}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <Label className="text-xs">{language === "ar" ? "نشط" : "Active"}</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={resetForm}>
                <X className="me-2 h-4 w-4" /> {language === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button size="sm" onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending}>
                <Save className="me-2 h-4 w-4" /> {language === "ar" ? "حفظ" : "Save"}
              </Button>
            </div>
          </div>
        )}

        {/* Templates List */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{language === "ar" ? "جاري التحميل..." : "Loading..."}</p>
        ) : rubrics && rubrics.length > 0 ? (
          <div className="space-y-3">
            {rubrics.map(rubric => {
              const criteriaList = (rubric.criteria as any as CriterionItem[]) || [];
              const isExpanded = expandedId === rubric.id;
              return (
                <div key={rubric.id} className="rounded-lg border">
                  <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : rubric.id)}>
                    <div className="flex items-center gap-3 min-w-0">
                      <ClipboardList className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {language === "ar" && rubric.name_ar ? rubric.name_ar : rubric.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {criteriaList.length} {language === "ar" ? "معايير" : "criteria"}
                          </Badge>
                          {rubric.competition_type && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{rubric.competition_type}</Badge>
                          )}
                          {!rubric.is_active && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Inactive</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {competitionId && (
                        <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); applyToCompetitionMutation.mutate(rubric.id); }}>
                          {language === "ar" ? "تطبيق" : "Apply"}
                        </Button>
                      )}
                      {isAdmin && (
                        <>
                          <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); startEdit(rubric); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); deleteMutation.mutate(rubric.id); }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                  {isExpanded && criteriaList.length > 0 && (
                    <div className="border-t p-3 space-y-2 bg-muted/30">
                      {criteriaList.map((c, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span>{language === "ar" && c.name_ar ? c.name_ar : c.name}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{c.max_score} pts</Badge>
                            <span className="text-xs text-muted-foreground">w: {c.weight}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            {language === "ar" ? "لا توجد قوالب بعد" : "No rubric templates yet"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
