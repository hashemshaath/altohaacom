import { useState, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useEvaluationDomains, useEvaluationCriteriaByDomain } from "@/hooks/useEvaluationSystem";
import { EvaluationReportPreview } from "./EvaluationReportPreview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  Plus, Copy, Pencil, Trash2, Save, FileText, ChefHat, Trophy, Wrench, Coffee,
  Layers, Star, Eye, Package, Target,
} from "lucide-react";

const DOMAIN_ICONS: Record<string, React.ElementType> = {
  chefs_table: ChefHat,
  competition: Trophy,
  equipment: Wrench,
  beverage: Coffee,
};

const CATEGORY_ICONS: Record<string, string> = {
  beverage: "🥤",
  meat: "🥩",
  seafood: "🐟",
  dairy: "🥛",
  spices: "🌶️",
  general: "📦",
};

const TEMPLATE_TYPES = [
  { value: "general", en: "General", ar: "عام" },
  { value: "competition", en: "Competition", ar: "مسابقة" },
  { value: "chefs_table", en: "Chef's Table", ar: "طاولة الشيف" },
  { value: "judging", en: "Judging Panel", ar: "لجنة تحكيم" },
];

interface Template {
  id: string;
  domain_id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  template_type: string;
  product_category: string | null;
  criteria_snapshot: any;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

function useEvaluationTemplates(domainId?: string) {
  return useQuery({
    queryKey: ["evaluation-templates", domainId],
    queryFn: async () => {
      let query = supabase
        .from("evaluation_templates" as any)
        .select("id, domain_id, name, name_ar, description, description_ar, template_type, product_category, criteria_snapshot, is_default, is_active, created_at")
        .order("created_at", { ascending: false });
      if (domainId) query = query.eq("domain_id", domainId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as Template[];
    },
  });
}

export const TemplatesManager = memo(function TemplatesManager() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const queryClient = useQueryClient();
  const { data: domains } = useEvaluationDomains();
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [editingTemplate, setEditingTemplate] = useState<Partial<Template> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const domainObj = domains?.find(d => d.id === selectedDomain || d.slug === selectedDomain);
  const domainId = domainObj?.id;
  const { data: templates } = useEvaluationTemplates(domainId);
  const { data: criteriaData } = useEvaluationCriteriaByDomain(domainObj?.slug || "");

  if (!selectedDomain && domains?.length) {
    setSelectedDomain(domains[0].id);
  }

  const saveMutation = useMutation({
    mutationFn: async (template: Partial<Template>) => {
      if (template.id) {
        const { id, created_at, ...rest } = template as any;
        const { error } = await supabase
          .from("evaluation_templates" as any)
          .update(rest as any)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { id, created_at, ...rest } = template as any;
        const { error } = await supabase
          .from("evaluation_templates" as any)
          .insert({ ...rest, domain_id: domainId } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-templates"] });
      toast.success(isAr ? "تم الحفظ" : "Template saved");
      setEditingTemplate(null);
      setIsCreating(false);
    },
    onError: () => toast.error(isAr ? "حدث خطأ" : "Failed to save"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("evaluation_templates" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-templates"] });
      toast.success(isAr ? "تم الحذف" : "Deleted");
    },
  });

  const captureCurrentCriteria = () => {
    if (!criteriaData) return [];
    return criteriaData.categories.map(cat => ({
      category: { name: cat.name, name_ar: cat.name_ar, product_category: cat.product_category },
      criteria: criteriaData.criteria
        .filter(c => c.category_id === cat.id)
        .map(c => ({
          name: c.name, name_ar: c.name_ar,
          description: c.description, description_ar: c.description_ar,
          max_score: c.max_score, weight: c.weight,
          is_required: c.is_required,
        })),
    }));
  };

  const handleCreateFromCurrent = () => {
    const snapshot = captureCurrentCriteria();
    setEditingTemplate({
      name: "", name_ar: "",
      description: "", description_ar: "",
      template_type: "general",
      product_category: null,
      criteria_snapshot: snapshot,
      is_default: false,
      is_active: true,
    });
    setIsCreating(true);
  };

  const handleDuplicate = (t: Template) => {
    setEditingTemplate({
      ...t,
      id: undefined,
      name: t.name + " (Copy)",
      name_ar: t.name_ar ? t.name_ar + " (نسخة)" : null,
      is_default: false,
    });
    setIsCreating(true);
  };

  // ─── Preview Mode ───
  if (previewTemplate) {
    return (
      <EvaluationReportPreview
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
      />
    );
  }

  // ─── Editor Mode ───
  if (editingTemplate) {
    const snapshot = editingTemplate.criteria_snapshot || [];
    const totalCriteria = Array.isArray(snapshot)
      ? snapshot.reduce((sum: number, cat: any) => sum + (cat.criteria?.length || 0), 0)
      : 0;

    return (
      <div className="space-y-6 print:space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">
            {isCreating ? (isAr ? "إنشاء قالب جديد" : "Create New Template") : (isAr ? "تعديل القالب" : "Edit Template")}
          </h3>
          <Button variant="ghost" size="sm" onClick={() => { setEditingTemplate(null); setIsCreating(false); }}>
            {isAr ? "إلغاء" : "Cancel"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>{isAr ? "اسم القالب (إنجليزي)" : "Template Name (EN)"}</Label>
            <Input value={editingTemplate.name || ""} onChange={e => setEditingTemplate(p => ({ ...p!, name: e.target.value }))} />
          </div>
          <div>
            <Label>{isAr ? "اسم القالب (عربي)" : "Template Name (AR)"}</Label>
            <Input value={editingTemplate.name_ar || ""} onChange={e => setEditingTemplate(p => ({ ...p!, name_ar: e.target.value }))} dir="rtl" />
          </div>
          <div>
            <Label>{isAr ? "النوع" : "Type"}</Label>
            <Select value={editingTemplate.template_type || "general"} onValueChange={v => setEditingTemplate(p => ({ ...p!, template_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TEMPLATE_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Switch
              checked={editingTemplate.is_default || false}
              onCheckedChange={v => setEditingTemplate(p => ({ ...p!, is_default: v }))}
            />
            <Label>{isAr ? "قالب افتراضي" : "Default Template"}</Label>
          </div>
        </div>

        <div>
          <Label>{isAr ? "الوصف" : "Description"}</Label>
          <Textarea value={editingTemplate.description || ""} onChange={e => setEditingTemplate(p => ({ ...p!, description: e.target.value }))} rows={2} />
        </div>

        <Separator />

        <div>
          <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Layers className="h-4 w-4" />
            {isAr ? "معايير التقييم المحفوظة" : "Saved Criteria"} ({totalCriteria})
          </h4>
          {Array.isArray(snapshot) && snapshot.map((cat: any, ci: number) => (
            <Card key={ci} className="mb-3 border-border/40">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">{isAr && cat.category?.name_ar ? cat.category.name_ar : cat.category?.name}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">{isAr ? "المعيار" : "Criterion"}</TableHead>
                      <TableHead className="text-xs w-20">{isAr ? "أقصى" : "Max"}</TableHead>
                      <TableHead className="text-xs w-20">{isAr ? "وزن" : "Weight"}</TableHead>
                      <TableHead className="text-xs w-20">{isAr ? "مطلوب" : "Req."}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cat.criteria?.map((cr: any, cri: number) => (
                      <TableRow key={cri}>
                        <TableCell className="text-sm">{isAr && cr.name_ar ? cr.name_ar : cr.name}</TableCell>
                        <TableCell className="text-sm font-bold">{cr.max_score}</TableCell>
                        <TableCell className="text-sm font-bold">{cr.weight}%</TableCell>
                        <TableCell>
                          {cr.is_required ? <Badge variant="destructive" className="text-[9px]">{isAr ? "نعم" : "Yes"}</Badge> : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-2 print:hidden">
          <Button variant="outline" onClick={() => { setEditingTemplate(null); setIsCreating(false); }}>
            {isAr ? "إلغاء" : "Cancel"}
          </Button>
          <Button onClick={() => saveMutation.mutate(editingTemplate)} disabled={!editingTemplate.name} className="gap-1.5">
            <Save className="h-4 w-4" />
            {isAr ? "حفظ القالب" : "Save Template"}
          </Button>
        </div>
      </div>
    );
  }

  // ─── List Mode ───
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 flex-wrap">
          {domains?.map(d => {
            const Icon = DOMAIN_ICONS[d.slug] || FileText;
            return (
              <Button
                key={d.id}
                size="sm"
                variant={selectedDomain === d.id ? "default" : "outline"}
                onClick={() => setSelectedDomain(d.id)}
                className="gap-1.5"
              >
                <Icon className="h-3.5 w-3.5" />
                {isAr && d.name_ar ? d.name_ar : d.name}
              </Button>
            );
          })}
        </div>
        <Button size="sm" onClick={handleCreateFromCurrent} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          {isAr ? "قالب من المعايير الحالية" : "Template from Current Criteria"}
        </Button>
      </div>

      {!templates?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground/30" />
            <p className="mt-3 font-medium">{isAr ? "لا توجد قوالب" : "No templates yet"}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {isAr ? "أنشئ قالباً من المعايير الحالية لإعادة استخدامه" : "Create a template from current criteria for reuse"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map(t => {
            const totalCriteria = Array.isArray(t.criteria_snapshot)
              ? (t.criteria_snapshot as any[]).reduce((sum, cat: any) => sum + (cat.criteria?.length || 0), 0)
              : 0;
            const categories = Array.isArray(t.criteria_snapshot) ? (t.criteria_snapshot as any[]).length : 0;
            const emoji = CATEGORY_ICONS[t.product_category || "general"] || "📦";
            const totalWeight = Array.isArray(t.criteria_snapshot)
              ? (t.criteria_snapshot as any[]).reduce((sum, cat: any) =>
                  sum + (cat.criteria || []).reduce((cs: number, cr: any) => cs + (cr.weight || 0), 0), 0)
              : 0;

            return (
              <Card key={t.id} className="border-border/40 hover:border-primary/30 transition-all group">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl">
                      {emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm truncate">
                          {isAr && t.name_ar ? t.name_ar : t.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {t.is_default && <Badge className="text-[8px] h-4">{isAr ? "افتراضي" : "Default"}</Badge>}
                        <Badge variant="outline" className="text-[8px] h-4">
                          {TEMPLATE_TYPES.find(tt => tt.value === t.template_type)?.[isAr ? "ar" : "en"] || t.template_type}
                        </Badge>
                        {t.product_category && (
                          <Badge variant="secondary" className="text-[8px] h-4">{t.product_category}</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {t.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {isAr && t.description_ar ? t.description_ar : t.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="rounded-xl bg-muted/50 p-2 text-center">
                      <AnimatedCounter value={categories} className="text-lg font-black tabular-nums" />
                      <p className="text-[9px] text-muted-foreground">{isAr ? "فئات" : "Categories"}</p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-2 text-center">
                      <AnimatedCounter value={totalCriteria} className="text-lg font-black tabular-nums" />
                      <p className="text-[9px] text-muted-foreground">{isAr ? "معايير" : "Criteria"}</p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-2 text-center">
                      <AnimatedCounter value={totalWeight} className="text-lg font-black tabular-nums" suffix="%" />
                      <p className="text-[9px] text-muted-foreground">{isAr ? "الأوزان" : "Weight"}</p>
                    </div>
                  </div>

                  {/* Category breakdown mini-bars */}
                  <div className="space-y-1.5 mb-4">
                    {Array.isArray(t.criteria_snapshot) && (t.criteria_snapshot as any[]).slice(0, 4).map((cat: any, i: number) => {
                      const catWeight = (cat.criteria || []).reduce((s: number, c: any) => s + (c.weight || 0), 0);
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-[9px] text-muted-foreground truncate flex-1 min-w-0">
                            {isAr && cat.category?.name_ar ? cat.category.name_ar : cat.category?.name}
                          </span>
                          <div className="w-16 shrink-0">
                            <Progress value={Math.min(catWeight, 100)} className="h-1" />
                          </div>
                          <span className="text-[9px] font-bold tabular-nums w-8 text-end">{catWeight}%</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 border-t border-border/30 pt-3">
                    <Button size="sm" variant="outline" className="gap-1 h-7 text-[10px] flex-1" onClick={() => setPreviewTemplate(t)}>
                      <Eye className="h-3 w-3" />
                      {isAr ? "معاينة التقرير" : "Preview Report"}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingTemplate(t)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDuplicate(t)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(t.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
