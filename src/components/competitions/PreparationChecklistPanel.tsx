import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { ClipboardCheck, Plus, Trash2, Sparkles } from "lucide-react";

interface ChecklistItem {
  label: string;
  label_ar?: string;
  category: string;
  completed: boolean;
}

interface Props {
  competitionId: string;
}

const DEFAULT_ITEMS: ChecklistItem[] = [
  { label: "Review competition rules", label_ar: "مراجعة قواعد المسابقة", category: "preparation", completed: false },
  { label: "Prepare ingredients list", label_ar: "تجهيز قائمة المكونات", category: "ingredients", completed: false },
  { label: "Check equipment requirements", label_ar: "فحص متطلبات المعدات", category: "equipment", completed: false },
  { label: "Practice recipe timing", label_ar: "تمرين توقيت الوصفة", category: "practice", completed: false },
  { label: "Prepare uniform/attire", label_ar: "تجهيز الزي الرسمي", category: "attire", completed: false },
  { label: "Confirm registration details", label_ar: "تأكيد بيانات التسجيل", category: "admin", completed: false },
  { label: "Bring ID & registration confirmation", label_ar: "إحضار الهوية وتأكيد التسجيل", category: "documents", completed: false },
  { label: "Plan transportation & arrival time", label_ar: "التخطيط للنقل ووقت الوصول", category: "logistics", completed: false },
];

const CATEGORIES: Record<string, { en: string; ar: string }> = {
  preparation: { en: "Preparation", ar: "التحضير" },
  ingredients: { en: "Ingredients", ar: "المكونات" },
  equipment: { en: "Equipment", ar: "المعدات" },
  practice: { en: "Practice", ar: "التمرين" },
  attire: { en: "Attire", ar: "الزي" },
  admin: { en: "Admin", ar: "إداري" },
  documents: { en: "Documents", ar: "المستندات" },
  logistics: { en: "Logistics", ar: "الخدمات اللوجستية" },
  custom: { en: "Custom", ar: "مخصص" },
};

export function PreparationChecklistPanel({ competitionId }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newItem, setNewItem] = useState("");
  const [items, setItems] = useState<ChecklistItem[]>([]);

  const { data: checklist, isLoading } = useQuery({
    queryKey: ["preparation-checklist", competitionId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("preparation_checklists")
        .select("*")
        .eq("competition_id", competitionId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (checklist?.items) {
      setItems(checklist.items as unknown as ChecklistItem[]);
    }
  }, [checklist]);

  const upsertChecklist = useMutation({
    mutationFn: async (updatedItems: ChecklistItem[]) => {
      if (!user) return;
      const completed = updatedItems.filter(i => i.completed).length;
      const progress = updatedItems.length > 0 ? (completed / updatedItems.length) * 100 : 0;

      const { error } = await supabase.from("preparation_checklists").upsert({
        competition_id: competitionId,
        user_id: user.id,
        items: updatedItems as any,
        progress_percentage: progress,
      }, { onConflict: "competition_id,user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preparation-checklist", competitionId, user?.id] });
    },
  });

  const initializeChecklist = () => {
    setItems(DEFAULT_ITEMS);
    upsertChecklist.mutate(DEFAULT_ITEMS);
    toast({ title: isAr ? "تم إنشاء القائمة" : "Checklist initialized" });
  };

  const toggleItem = (idx: number) => {
    const updated = items.map((item, i) => i === idx ? { ...item, completed: !item.completed } : item);
    setItems(updated);
    upsertChecklist.mutate(updated);
  };

  const addItem = () => {
    if (!newItem.trim()) return;
    const updated = [...items, { label: newItem.trim(), category: "custom", completed: false }];
    setItems(updated);
    upsertChecklist.mutate(updated);
    setNewItem("");
  };

  const removeItem = (idx: number) => {
    const updated = items.filter((_, i) => i !== idx);
    setItems(updated);
    upsertChecklist.mutate(updated);
  };

  if (!user) return null;
  if (isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;

  const completedCount = items.filter(i => i.completed).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  if (!checklist && items.length === 0) {
    return (
      <Card className="border-dashed border-2 border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <ClipboardCheck className="h-10 w-10 text-muted-foreground/20 mb-3" />
          <p className="font-medium text-sm">{isAr ? "قائمة التحضير" : "Preparation Checklist"}</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            {isAr ? "أنشئ قائمة تحضير مخصصة لهذه المسابقة" : "Create a personalized prep checklist for this competition"}
          </p>
          <Button onClick={initializeChecklist} size="sm">
            <Sparkles className="me-1.5 h-4 w-4" />{isAr ? "إنشاء القائمة" : "Initialize Checklist"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/10">
            <ClipboardCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{isAr ? "قائمة التحضير" : "Prep Checklist"}</h3>
            <p className="text-xs text-muted-foreground">{completedCount}/{items.length} {isAr ? "مكتمل" : "completed"}</p>
          </div>
        </div>
        <Badge variant={progress === 100 ? "default" : "outline"} className="text-xs">
          {Math.round(progress)}%
        </Badge>
      </div>

      <Progress value={progress} className="h-2" />

      {/* Add new item */}
      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          placeholder={isAr ? "أضف عنصر جديد..." : "Add new item..."}
          className="flex-1 h-9 text-sm"
          onKeyDown={e => { if (e.key === "Enter") addItem(); }}
        />
        <Button size="sm" variant="outline" onClick={addItem} disabled={!newItem.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Items grouped by category */}
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-3 rounded-lg border p-2.5 transition-all group ${
              item.completed ? "border-chart-5/20 bg-chart-5/5 opacity-70" : "border-border/50 hover:border-primary/20"
            }`}
          >
            <Checkbox
              checked={item.completed}
              onCheckedChange={() => toggleItem(idx)}
              className="shrink-0"
            />
            <div className="flex-1 min-w-0">
              <span className={`text-sm ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                {isAr && item.label_ar ? item.label_ar : item.label}
              </span>
              <Badge variant="outline" className="text-[9px] ms-2">
                {CATEGORIES[item.category] ? (isAr ? CATEGORIES[item.category].ar : CATEGORIES[item.category].en) : item.category}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              onClick={() => removeItem(idx)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
