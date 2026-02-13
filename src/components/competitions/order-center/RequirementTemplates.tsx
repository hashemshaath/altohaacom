import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BookTemplate, Plus, Download, Upload, Trash2, Globe, Lock,
  Package, Copy, CheckCircle,
} from "lucide-react";
import { ORDER_CATEGORIES } from "./OrderCenterCategories";

interface Props {
  competitionId: string;
  isOrganizer?: boolean;
}

export function RequirementTemplates({ competitionId, isOrganizer }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", name_ar: "", description: "", category: "general", is_public: false });

  // Get templates (own + public)
  const { data: templates, isLoading } = useQuery({
    queryKey: ["requirement-templates", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirement_templates" as any)
        .select("*")
        .or(`created_by.eq.${user!.id},is_public.eq.true`)
        .order("usage_count", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  // Get current competition's lists for "save as template"
  const { data: currentLists } = useQuery({
    queryKey: ["template-current-lists", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirement_lists")
        .select("id, title, title_ar, category")
        .eq("competition_id", competitionId);
      if (error) throw error;
      return data;
    },
  });

  const { data: currentItems } = useQuery({
    queryKey: ["template-current-items", competitionId],
    queryFn: async () => {
      if (!currentLists?.length) return [];
      const { data, error } = await supabase
        .from("requirement_list_items")
        .select("id, list_id, custom_name, custom_name_ar, item_id, quantity, unit, estimated_cost, sort_order, requirement_items(name, name_ar, category)")
        .in("list_id", currentLists.map(l => l.id));
      if (error) throw error;
      return data as any[];
    },
    enabled: !!currentLists?.length,
  });

  // Save current lists as template
  const saveAsTemplate = useMutation({
    mutationFn: async () => {
      const templateItems = (currentItems || []).map(item => ({
        custom_name: item.custom_name || (item.requirement_items?.name) || "",
        custom_name_ar: item.custom_name_ar || (item.requirement_items?.name_ar) || "",
        quantity: item.quantity,
        unit: item.unit,
        estimated_cost: item.estimated_cost,
        category: item.requirement_items?.category || "general",
      }));

      const { error } = await supabase.from("requirement_templates" as any).insert({
        name: form.name,
        name_ar: form.name_ar || null,
        description: form.description || null,
        category: form.category,
        items: templateItems,
        created_by: user!.id,
        is_public: form.is_public,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requirement-templates"] });
      setShowCreate(false);
      setForm({ name: "", name_ar: "", description: "", category: "general", is_public: false });
      toast({ title: isAr ? "تم حفظ القالب" : "Template saved" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  // Apply template to current competition
  const applyTemplate = useMutation({
    mutationFn: async (template: any) => {
      // Create a new list from template
      const { data: newList, error: listError } = await supabase
        .from("requirement_lists")
        .insert({
          competition_id: competitionId,
          title: `${isAr && template.name_ar ? template.name_ar : template.name}`,
          title_ar: template.name_ar || null,
          category: template.category,
          created_by: user!.id,
          description: template.description || null,
        })
        .select("id")
        .single();
      if (listError) throw listError;

      // Insert items
      const items = (template.items || []).map((item: any, idx: number) => ({
        list_id: newList.id,
        custom_name: item.custom_name,
        custom_name_ar: item.custom_name_ar || null,
        quantity: item.quantity || 1,
        unit: item.unit || "unit",
        estimated_cost: item.estimated_cost || null,
        sort_order: idx,
      }));

      if (items.length) {
        const { error: itemsError } = await supabase
          .from("requirement_list_items")
          .insert(items);
        if (itemsError) throw itemsError;
      }

      // Increment usage count
      await supabase
        .from("requirement_templates" as any)
        .update({ usage_count: (template.usage_count || 0) + 1 } as any)
        .eq("id", template.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requirement-lists", competitionId] });
      queryClient.invalidateQueries({ queryKey: ["requirement-templates"] });
      toast({ title: isAr ? "تم تطبيق القالب" : "Template applied" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  // Delete template
  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("requirement_templates" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requirement-templates"] });
      toast({ title: isAr ? "تم حذف القالب" : "Template deleted" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookTemplate className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">{isAr ? "قوالب المتطلبات" : "Requirement Templates"}</h3>
        </div>
        {isOrganizer && currentItems && currentItems.length > 0 && (
          <Button size="sm" variant="outline" onClick={() => setShowCreate(true)}>
            <Upload className="me-1.5 h-3.5 w-3.5" />
            {isAr ? "حفظ كقالب" : "Save as Template"}
          </Button>
        )}
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card className="border-primary/20">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{isAr ? "الاسم (إنجليزي)" : "Name (English)"}</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">{isAr ? "الاسم (عربي)" : "Name (Arabic)"}</Label>
                <Input value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} className="h-8 text-sm" dir="rtl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{isAr ? "الفئة" : "Category"}</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ORDER_CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value} className="text-xs">
                        {isAr ? c.labelAr : c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button
                  size="sm"
                  variant={form.is_public ? "default" : "outline"}
                  onClick={() => setForm({ ...form, is_public: !form.is_public })}
                  className="h-8 text-xs"
                >
                  {form.is_public ? <Globe className="me-1 h-3 w-3" /> : <Lock className="me-1 h-3 w-3" />}
                  {form.is_public ? (isAr ? "عام" : "Public") : (isAr ? "خاص" : "Private")}
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-xs">{isAr ? "الوصف" : "Description"}</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="text-sm min-h-[60px]" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => saveAsTemplate.mutate()} disabled={!form.name || saveAsTemplate.isPending}>
                <CheckCircle className="me-1.5 h-3.5 w-3.5" />
                {isAr ? "حفظ" : "Save"} ({currentItems?.length || 0} {isAr ? "عنصر" : "items"})
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)}>
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates List */}
      {!templates?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookTemplate className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">{isAr ? "لا توجد قوالب بعد" : "No templates yet"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {isAr ? "احفظ قوائم متطلبات المسابقة كقالب لإعادة استخدامها" : "Save competition requirement lists as templates for reuse"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {templates.map((tpl: any) => {
            const catDef = ORDER_CATEGORIES.find(c => c.value === tpl.category);
            const itemCount = (tpl.items || []).length;
            const isOwn = tpl.created_by === user?.id;
            return (
              <Card key={tpl.id} className="border-border/60 hover:shadow-sm transition-shadow">
                <CardHeader className="pb-2 px-4 pt-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      {isAr && tpl.name_ar ? tpl.name_ar : tpl.name}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      {tpl.is_public ? (
                        <Badge variant="outline" className="text-[9px] h-4"><Globe className="h-2.5 w-2.5 me-0.5" />{isAr ? "عام" : "Public"}</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] h-4"><Lock className="h-2.5 w-2.5 me-0.5" />{isAr ? "خاص" : "Private"}</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span>{catDef ? (isAr ? catDef.labelAr : catDef.label) : tpl.category}</span>
                    <span>·</span>
                    <span>{itemCount} {isAr ? "عنصر" : "items"}</span>
                    {tpl.usage_count > 0 && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <Copy className="h-2.5 w-2.5" /> {tpl.usage_count}x {isAr ? "مستخدم" : "used"}
                        </span>
                      </>
                    )}
                  </div>
                  {tpl.description && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2">{tpl.description}</p>
                  )}
                  <div className="flex items-center gap-2">
                    {isOrganizer && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => applyTemplate.mutate(tpl)}
                        disabled={applyTemplate.isPending}
                      >
                        <Download className="me-1 h-3 w-3" />
                        {isAr ? "تطبيق" : "Apply"}
                      </Button>
                    )}
                    {isOwn && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-destructive hover:text-destructive"
                        onClick={() => { if (confirm(isAr ? "حذف القالب؟" : "Delete template?")) deleteTemplate.mutate(tpl.id); }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
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
