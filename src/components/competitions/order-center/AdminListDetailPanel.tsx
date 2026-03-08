import { useState, useMemo, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ChevronRight, Plus, Trash2, Save, X, Package, Search, ListPlus,
  CheckCircle, Clock, AlertTriangle, User, Calendar, StickyNote, Star,
} from "lucide-react";
import { ORDER_CATEGORIES, ITEM_UNITS } from "./OrderCenterCategories";
import { ITEM_STATUS_LABELS, getStatusLabel } from "./OrderStatusLabels";
import { format } from "date-fns";

interface Props {
  listId: string;
  onBack: () => void;
}

const IMPORTANCE_LEVELS = [
  { value: "low", labelEn: "Low", labelAr: "منخفض", color: "text-muted-foreground" },
  { value: "normal", labelEn: "Normal", labelAr: "عادي", color: "text-chart-3" },
  { value: "high", labelEn: "High", labelAr: "مرتفع", color: "text-chart-4" },
  { value: "critical", labelEn: "Critical", labelAr: "حرج", color: "text-destructive" },
];

export const AdminListDetailPanel = memo(function AdminListDetailPanel({ listId, onBack }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const [showAddItem, setShowAddItem] = useState(false);
  const [showCatalogSearch, setShowCatalogSearch] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [form, setForm] = useState({
    custom_name: "", custom_name_ar: "", quantity: 1, unit: "piece",
    estimated_cost: 0, notes: "", notes_ar: "", importance: "normal",
  });

  // Fetch list info
  const { data: list } = useQuery({
    queryKey: ["admin-list-detail", listId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirement_lists")
        .select("*, competitions:competition_id(id, title, title_ar, status)")
        .eq("id", listId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch list items
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-list-items", listId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirement_list_items")
        .select("*, requirement_items(name, name_ar, category, description, description_ar)")
        .eq("list_id", listId)
        .order("sort_order");
      if (error) throw error;
      return data as any[];
    },
  });

  // Fetch catalog items for adding
  const { data: catalogItems = [] } = useQuery({
    queryKey: ["catalog-search-for-list", catalogSearch],
    queryFn: async () => {
      let q = supabase.from("requirement_items").select("id, name, name_ar, category, unit, default_quantity, estimated_cost, description, description_ar")
        .eq("is_active", true).order("name").limit(50);
      if (catalogSearch) q = q.or(`name.ilike.%${catalogSearch}%,name_ar.ilike.%${catalogSearch}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: showCatalogSearch,
  });

  // Fetch editor profiles
  const { data: profiles = [] } = useQuery({
    queryKey: ["list-item-editors", listId],
    queryFn: async () => {
      const editorIds = [...new Set(items.filter(i => i.last_edited_by || i.checked_by || i.added_by).flatMap(i => [i.last_edited_by, i.checked_by, i.added_by].filter(Boolean)))];
      if (!editorIds.length) return [];
      const { data } = await supabase.from("profiles").select("user_id, full_name, username").in("user_id", editorIds);
      return data || [];
    },
    enabled: items.length > 0,
  });

  const getProfileName = (id: string | null) => {
    if (!id) return "—";
    const p = profiles.find((pr: any) => pr.user_id === id);
    return p?.full_name || p?.username || "—";
  };

  // Add custom item
  const addItem = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("requirement_list_items").insert({
        list_id: listId, ...data, added_by: user!.id, sort_order: items.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-list-items", listId] });
      setShowAddItem(false);
      setForm({ custom_name: "", custom_name_ar: "", quantity: 1, unit: "piece", estimated_cost: 0, notes: "", notes_ar: "", importance: "normal" });
      toast({ title: isAr ? "تمت إضافة العنصر" : "Item added" });
    },
  });

  // Add from catalog
  const addFromCatalog = useMutation({
    mutationFn: async (catalogItem: any) => {
      const { error } = await supabase.from("requirement_list_items").insert({
        list_id: listId, item_id: catalogItem.id, quantity: catalogItem.default_quantity || 1,
        unit: catalogItem.unit || "piece", estimated_cost: catalogItem.estimated_cost,
        added_by: user!.id, sort_order: items.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-list-items", listId] });
      toast({ title: isAr ? "تمت إضافة العنصر من الكتالوج" : "Item added from catalog" });
    },
  });

  // Update item inline
  const updateItem = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("requirement_list_items").update({
        ...updates, last_edited_by: user!.id, last_edited_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-list-items", listId] });
    },
  });

  // Delete item
  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("requirement_list_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-list-items", listId] });
      toast({ title: isAr ? "تم حذف العنصر" : "Item removed" });
    },
  });

  // Stats
  const { total, delivered, checked, progress, critical } = useMemo(() => {
    const t = items.length;
    const d = items.filter(i => i.status === "delivered").length;
    return {
      total: t,
      delivered: d,
      checked: items.filter(i => i.checked).length,
      progress: t > 0 ? Math.round((d / t) * 100) : 0,
      critical: items.filter(i => i.importance === "critical").length,
    };
  }, [items]);

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
        <ChevronRight className={`h-3.5 w-3.5 ${isAr ? "" : "rotate-180"}`} />
        {isAr ? "العودة للقوائم" : "Back to Lists"}
      </Button>

      {/* List Header */}
      {list && (
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{isAr && list.title_ar ? list.title_ar : list.title}</h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  {list.competitions && <Badge variant="outline" className="text-[9px]">{isAr && list.competitions.title_ar ? list.competitions.title_ar : list.competitions.title}</Badge>}
                  <Badge variant="secondary" className="text-[9px]">{list.status || "draft"}</Badge>
                  {list.category && <Badge variant="outline" className="text-[9px]">{list.category}</Badge>}
                </div>
              </div>
              <div className="text-end">
                <p className="text-2xl font-bold text-primary">{progress}%</p>
                <p className="text-[10px] text-muted-foreground">{delivered}/{total} {isAr ? "تم تسليمه" : "delivered"}</p>
              </div>
            </div>
            <Progress value={progress} className="h-1.5 mt-3" />
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-2">
        <Card className="border-border/60"><CardContent className="p-2 text-center">
          <Package className="mx-auto mb-0.5 h-4 w-4 text-primary" />
          <p className="text-sm font-bold">{total}</p>
          <p className="text-[9px] text-muted-foreground">{isAr ? "عناصر" : "Items"}</p>
        </CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-2 text-center">
          <CheckCircle className="mx-auto mb-0.5 h-4 w-4 text-chart-5" />
          <p className="text-sm font-bold">{checked}</p>
          <p className="text-[9px] text-muted-foreground">{isAr ? "تم التحقق" : "Checked"}</p>
        </CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-2 text-center">
          <Clock className="mx-auto mb-0.5 h-4 w-4 text-chart-4" />
          <p className="text-sm font-bold">{total - delivered}</p>
          <p className="text-[9px] text-muted-foreground">{isAr ? "معلقة" : "Pending"}</p>
        </CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-2 text-center">
          <AlertTriangle className="mx-auto mb-0.5 h-4 w-4 text-destructive" />
          <p className="text-sm font-bold">{critical}</p>
          <p className="text-[9px] text-muted-foreground">{isAr ? "حرج" : "Critical"}</p>
        </CardContent></Card>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" onClick={() => setShowAddItem(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> {isAr ? "إضافة عنصر يدوي" : "Add Custom Item"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowCatalogSearch(!showCatalogSearch)} className="gap-1.5">
          <ListPlus className="h-3.5 w-3.5" /> {isAr ? "إضافة من الكتالوج" : "Add from Catalog"}
        </Button>
      </div>

      {/* Catalog search popover */}
      {showCatalogSearch && (
        <Card className="border-chart-3/20">
          <CardContent className="p-3 space-y-2">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder={isAr ? "بحث في الكتالوج..." : "Search catalog..."} value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)} className="ps-9 h-8 text-sm" />
            </div>
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {catalogItems.map(ci => (
                <div key={ci.id} className="flex items-center justify-between rounded border px-3 py-1.5 hover:bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">{isAr && ci.name_ar ? ci.name_ar : ci.name}</p>
                    <p className="text-[10px] text-muted-foreground">{isAr && ci.description_ar ? ci.description_ar : ci.description} · {ci.default_quantity} {ci.unit}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => addFromCatalog.mutate(ci)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {catalogItems.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">{isAr ? "لا توجد نتائج" : "No results"}</p>}
            </div>
            <Button size="sm" variant="ghost" onClick={() => setShowCatalogSearch(false)} className="w-full text-xs">
              {isAr ? "إغلاق" : "Close"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add custom item form */}
      {showAddItem && (
        <Card className="border-primary/20">
          <CardContent className="p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px]">{isAr ? "الاسم" : "Name"} *</Label>
                <Input value={form.custom_name} onChange={e => setForm({ ...form, custom_name: e.target.value })} className="h-7 text-sm" />
              </div>
              <div>
                <Label className="text-[10px]">{isAr ? "الاسم (عربي)" : "Name (AR)"}</Label>
                <Input value={form.custom_name_ar} onChange={e => setForm({ ...form, custom_name_ar: e.target.value })} className="h-7 text-sm" dir="rtl" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <Label className="text-[10px]">{isAr ? "الكمية" : "Qty"}</Label>
                <Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} className="h-7 text-sm" />
              </div>
              <div>
                <Label className="text-[10px]">{isAr ? "الوحدة" : "Unit"}</Label>
                <Select value={form.unit} onValueChange={v => setForm({ ...form, unit: v })}>
                  <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{ITEM_UNITS.map(u => <SelectItem key={u.value} value={u.value} className="text-xs">{isAr ? u.labelAr : u.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px]">{isAr ? "التكلفة" : "Cost"}</Label>
                <Input type="number" value={form.estimated_cost} onChange={e => setForm({ ...form, estimated_cost: Number(e.target.value) })} className="h-7 text-sm" />
              </div>
              <div>
                <Label className="text-[10px]">{isAr ? "الأهمية" : "Importance"}</Label>
                <Select value={form.importance} onValueChange={v => setForm({ ...form, importance: v })}>
                  <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{IMPORTANCE_LEVELS.map(l => <SelectItem key={l.value} value={l.value} className="text-xs">{isAr ? l.labelAr : l.labelEn}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-[10px]">{isAr ? "ملاحظات / توصيات" : "Notes / Recommendations"}</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="text-sm min-h-[40px]" placeholder={isAr ? "نوع العنصر، توصيات، أهمية..." : "Type, recommendations, importance..."} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => addItem.mutate({
                custom_name: form.custom_name, custom_name_ar: form.custom_name_ar || null,
                quantity: form.quantity, unit: form.unit, estimated_cost: form.estimated_cost || null,
                notes: form.notes || null, notes_ar: form.notes_ar || null, importance: form.importance,
              })} disabled={!form.custom_name}>
                <Save className="me-1 h-3 w-3" /> {isAr ? "إضافة" : "Add"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAddItem(false)}>
                <X className="me-1 h-3 w-3" /> {isAr ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items List */}
      {isLoading ? (
        <div className="flex justify-center py-6"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : items.length === 0 ? (
        <Card><CardContent className="py-8 text-center">
          <Package className="mx-auto mb-2 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{isAr ? "لا توجد عناصر في هذه القائمة" : "No items in this list"}</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => {
            const name = item.item_id && item.requirement_items
              ? (isAr && item.requirement_items.name_ar ? item.requirement_items.name_ar : item.requirement_items.name)
              : (isAr && item.custom_name_ar ? item.custom_name_ar : item.custom_name);
            const desc = item.item_id && item.requirement_items
              ? (isAr && item.requirement_items.description_ar ? item.requirement_items.description_ar : item.requirement_items.description)
              : null;
            const imp = IMPORTANCE_LEVELS.find(l => l.value === (item.importance || "normal"));
            const isOverdue = item.deadline && new Date(item.deadline) < new Date() && item.status !== "delivered";

            return (
              <Card key={item.id} className={`border-border/60 ${item.status === "delivered" ? "bg-chart-5/5" : isOverdue ? "bg-destructive/5" : ""}`}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <Checkbox checked={!!item.checked} onCheckedChange={c => updateItem.mutate({ id: item.id, updates: { checked: !!c, checked_by: c ? user!.id : null, checked_at: c ? new Date().toISOString() : null } })} className="mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${item.checked ? "line-through text-muted-foreground" : ""}`}>{name || `#${idx + 1}`}</p>
                        {imp && imp.value !== "normal" && (
                          <Badge variant="outline" className={`text-[8px] ${imp.color}`}>
                            <Star className="h-2 w-2 me-0.5" />{isAr ? imp.labelAr : imp.labelEn}
                          </Badge>
                        )}
                      </div>
                      {desc && <p className="text-[10px] text-muted-foreground line-clamp-1">{desc}</p>}

                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {/* Inline editable quantity */}
                        <Input type="number" defaultValue={item.quantity} className="h-5 w-14 text-[10px] px-1" onBlur={e => {
                          const v = Number(e.target.value);
                          if (v !== item.quantity) updateItem.mutate({ id: item.id, updates: { quantity: v } });
                        }} />
                        <Select defaultValue={item.unit || "piece"} onValueChange={v => updateItem.mutate({ id: item.id, updates: { unit: v } })}>
                          <SelectTrigger className="h-5 w-16 text-[10px]"><SelectValue /></SelectTrigger>
                          <SelectContent>{ITEM_UNITS.map(u => <SelectItem key={u.value} value={u.value} className="text-xs">{isAr ? u.labelAr : u.label}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select defaultValue={item.status || "pending"} onValueChange={v => updateItem.mutate({ id: item.id, updates: { status: v } })}>
                          <SelectTrigger className="h-5 w-20 text-[10px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["pending", "sourced", "sponsored", "purchased", "delivered"].map(s => (
                              <SelectItem key={s} value={s} className="text-xs">{getStatusLabel(ITEM_STATUS_LABELS, s, language)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select defaultValue={item.importance || "normal"} onValueChange={v => updateItem.mutate({ id: item.id, updates: { importance: v } })}>
                          <SelectTrigger className="h-5 w-16 text-[10px]"><SelectValue /></SelectTrigger>
                          <SelectContent>{IMPORTANCE_LEVELS.map(l => <SelectItem key={l.value} value={l.value} className="text-xs">{isAr ? l.labelAr : l.labelEn}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>

                      {/* Notes */}
                      <Input placeholder={isAr ? "ملاحظات..." : "Notes..."} defaultValue={item.notes || ""} className="h-5 text-[10px] mt-1.5 border-dashed" onBlur={e => {
                        if (e.target.value !== (item.notes || "")) updateItem.mutate({ id: item.id, updates: { notes: e.target.value || null } });
                      }} />

                      {/* Attribution */}
                      <div className="flex items-center gap-3 mt-1.5 text-[9px] text-muted-foreground">
                        {item.added_by && <span className="flex items-center gap-0.5"><User className="h-2.5 w-2.5" /> {isAr ? "أضافه:" : "Added:"} {getProfileName(item.added_by)}</span>}
                        {item.checked_by && <span className="flex items-center gap-0.5"><CheckCircle className="h-2.5 w-2.5 text-chart-5" /> {getProfileName(item.checked_by)}</span>}
                        {item.last_edited_by && <span className="flex items-center gap-0.5"><StickyNote className="h-2.5 w-2.5" /> {isAr ? "عدّله:" : "Edited:"} {getProfileName(item.last_edited_by)}{item.last_edited_at ? ` · ${format(new Date(item.last_edited_at), "MMM d HH:mm")}` : ""}</span>}
                        {item.deadline && <span className={`flex items-center gap-0.5 ${isOverdue ? "text-destructive font-medium" : ""}`}><Calendar className="h-2.5 w-2.5" /> {format(new Date(item.deadline), "MMM d")}</span>}
                      </div>
                    </div>

                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive shrink-0" onClick={() => deleteItem.mutate(item.id)}>
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
