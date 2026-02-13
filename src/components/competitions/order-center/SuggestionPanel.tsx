import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Lightbulb, Plus, CheckCircle, XCircle, Clock } from "lucide-react";
import { ORDER_CATEGORIES, ITEM_UNITS } from "./OrderCenterCategories";
import { notifySuggestionReviewed } from "@/lib/notificationTriggers";
import { SUGGESTION_STATUS_LABELS, getStatusLabel } from "./OrderStatusLabels";

const STATUS_STYLES: Record<string, { icon: typeof Clock; color: string }> = {
  pending: { icon: Clock, color: "bg-muted text-muted-foreground" },
  approved: { icon: CheckCircle, color: "bg-chart-5/10 text-chart-5" },
  rejected: { icon: XCircle, color: "bg-destructive/10 text-destructive" },
  added: { icon: CheckCircle, color: "bg-primary/10 text-primary" },
};

interface Props {
  competitionId: string;
  isOrganizer?: boolean;
}

export function SuggestionPanel({ competitionId, isOrganizer }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    item_name: "", item_name_ar: "", category: "equipment", quantity: 1,
    unit: "piece", description: "", estimated_cost: "", priority: "medium",
  });

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["requirement-suggestions", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirement_suggestions")
        .select("*")
        .eq("competition_id", competitionId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const submitSuggestion = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("requirement_suggestions").insert({
        competition_id: competitionId,
        suggested_by: user!.id,
        item_name: form.item_name,
        item_name_ar: form.item_name_ar || null,
        category: form.category,
        quantity: form.quantity,
        unit: form.unit,
        description: form.description || null,
        estimated_cost: form.estimated_cost ? parseFloat(form.estimated_cost) : null,
        priority: form.priority,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requirement-suggestions", competitionId] });
      setShowForm(false);
      setForm({ item_name: "", item_name_ar: "", category: "equipment", quantity: 1, unit: "piece", description: "", estimated_cost: "", priority: "medium" });
      toast({ title: isAr ? "تم إرسال الاقتراح للمراجعة" : "Suggestion submitted for review" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const reviewSuggestion = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("requirement_suggestions").update({
        status,
        reviewed_by: user!.id,
        reviewed_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["requirement-suggestions", competitionId] });
      // Find the suggestion to notify the submitter
      const suggestion = suggestions?.find(s => s.id === variables.id);
      if (suggestion?.suggested_by) {
        notifySuggestionReviewed({
          userId: suggestion.suggested_by,
          itemName: suggestion.item_name,
          status: variables.status,
          competitionId,
        });
      }
      toast({ title: isAr ? "تم تحديث الاقتراح" : "Suggestion updated" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-chart-4" />
          <h4 className="font-semibold">{isAr ? "الاقتراحات" : "Suggestions"}</h4>
          {suggestions?.filter(s => s.status === "pending").length ? (
            <Badge variant="secondary">{suggestions.filter(s => s.status === "pending").length} {isAr ? "بانتظار المراجعة" : "pending"}</Badge>
          ) : null}
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
          <Plus className="me-1.5 h-3.5 w-3.5" />{isAr ? "اقتراح عنصر" : "Suggest Item"}
        </Button>
      </div>

      {showForm && (
        <Card className="border-chart-4/20">
          <CardContent className="p-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>{isAr ? "اسم العنصر (إنجليزي)" : "Item Name (English)"}</Label>
                <Input value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} />
              </div>
              <div>
                <Label>{isAr ? "اسم العنصر (عربي)" : "Item Name (Arabic)"}</Label>
                <Input value={form.item_name_ar} onChange={(e) => setForm({ ...form, item_name_ar: e.target.value })} dir="rtl" />
              </div>
              <div>
                <Label>{isAr ? "الفئة" : "Category"}</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ORDER_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{isAr ? c.labelAr : c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isAr ? "الأولوية" : "Priority"}</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{isAr ? "منخفضة" : "Low"}</SelectItem>
                    <SelectItem value="medium">{isAr ? "متوسطة" : "Medium"}</SelectItem>
                    <SelectItem value="high">{isAr ? "عالية" : "High"}</SelectItem>
                    <SelectItem value="critical">{isAr ? "حرجة" : "Critical"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isAr ? "الكمية" : "Quantity"}</Label>
                <Input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} />
              </div>
              <div>
                <Label>{isAr ? "الوحدة" : "Unit"}</Label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ITEM_UNITS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>{isAr ? u.labelAr : u.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>{isAr ? "الوصف (اختياري)" : "Description (optional)"}</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => submitSuggestion.mutate()} disabled={!form.item_name || submitSuggestion.isPending} className="flex-1">
                {isAr ? "إرسال الاقتراح" : "Submit Suggestion"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-6">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : !suggestions?.length ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Lightbulb className="mx-auto mb-2 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">{isAr ? "لا توجد اقتراحات بعد" : "No suggestions yet"}</p>
            <p className="text-xs text-muted-foreground mt-1">{isAr ? "يمكنك اقتراح عناصر يحتاجها الحدث" : "Suggest items needed for this event"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {suggestions.map((s) => {
            const catInfo = ORDER_CATEGORIES.find(c => c.value === s.category);
            const statusInfo = STATUS_STYLES[s.status] || STATUS_STYLES.pending;
            const StatusIcon = statusInfo.icon;
            return (
              <Card key={s.id} className="border-border/60">
                <CardContent className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <StatusIcon className="h-4 w-4 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {isAr && s.item_name_ar ? s.item_name_ar : s.item_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isAr ? catInfo?.labelAr : catInfo?.label} · {s.quantity} {s.unit}
                        {s.estimated_cost ? ` · $${Number(s.estimated_cost).toLocaleString()}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={statusInfo.color} variant="outline">{getStatusLabel(SUGGESTION_STATUS_LABELS, s.status, language)}</Badge>
                    {isOrganizer && s.status === "pending" && (
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => reviewSuggestion.mutate({ id: s.id, status: "approved" })}>
                          <CheckCircle className="h-4 w-4 text-chart-5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => reviewSuggestion.mutate({ id: s.id, status: "rejected" })}>
                          <XCircle className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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
