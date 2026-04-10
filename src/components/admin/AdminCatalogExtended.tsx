import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Save, Trash2, Plus, X, Archive, Eye, EyeOff, Tag, Shield, HelpCircle, Edit } from "lucide-react";

interface Props { companyId: string; }

export function AdminCatalogExtended({ companyId }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string | number | null>>({});
  const [qaForm, setQaForm] = useState({ catalog_item_id: "", question: "", question_ar: "", answer: "", answer_ar: "", answered_by: "", answered_by_ar: "" });
  const [showQaForm, setShowQaForm] = useState(false);
  const [badgeForm, setBadgeForm] = useState({ label: "", label_ar: "", badge_type: "custom", icon_name: "ShieldCheck", color_class: "text-primary" });
  const [showBadgeForm, setShowBadgeForm] = useState(false);

  // Catalog items with new fields
  const { data: items = [] } = useQuery({
    queryKey: ["admin-catalog-ext", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("company_catalog")
        .select("id, name, name_ar, category, unit_price, original_price, warranty_years, platform_discount_pct, coupon_code, coupon_discount_pct, is_active, is_archived, sku, image_url")
        .eq("company_id", companyId).order("name");
      return data || [];
    },
  });

  // Q&A items
  const { data: qaItems = [] } = useQuery({
    queryKey: ["admin-product-qa", companyId],
    queryFn: async () => {
      const itemIds = items.map(i => i.id);
      if (!itemIds.length) return [];
      const { data } = await supabase.from("product_qa").select("*").in("catalog_item_id", itemIds).order("created_at", { ascending: false }).limit(5000);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- product_qa select("*") returns dynamic columns
      return (data || []) as Record<string, unknown>[];
    },
    enabled: items.length > 0,
  });

  // Trust badges
  const { data: badges = [] } = useQuery({
    queryKey: ["admin-trust-badges", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("product_trust_badges").select("*").eq("company_id", companyId).order("sort_order").limit(500);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- product_trust_badges select("*") returns dynamic columns
      return (data || []) as Record<string, unknown>[];
    },
  });

  // Update catalog item
  const updateMut = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase.from("company_catalog").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-catalog-ext", companyId] }); toast({ title: isAr ? "تم الحفظ" : "Saved" }); setEditingId(null); },
  });

  // Archive/unarchive
  const archiveMut = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { error } = await supabase.from("company_catalog").update({ is_archived: archived }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-catalog-ext", companyId] }); toast({ title: isAr ? "تم التحديث" : "Updated" }); },
  });

  // Toggle active
  const toggleActiveMut = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("company_catalog").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-catalog-ext", companyId] }),
  });

  // Add Q&A
  const addQaMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("product_qa").insert({ ...qaForm } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-product-qa", companyId] }); setShowQaForm(false); setQaForm({ catalog_item_id: "", question: "", question_ar: "", answer: "", answer_ar: "", answered_by: "", answered_by_ar: "" }); toast({ title: isAr ? "تم الإضافة" : "Added" }); },
  });

  // Delete Q&A
  const deleteQaMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("product_qa").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-product-qa", companyId] }); toast({ title: isAr ? "تم الحذف" : "Deleted" }); },
  });

  // Add badge
  const addBadgeMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("product_trust_badges").insert({ company_id: companyId, ...badgeForm } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-trust-badges", companyId] }); setShowBadgeForm(false); setBadgeForm({ label: "", label_ar: "", badge_type: "custom", icon_name: "ShieldCheck", color_class: "text-primary" }); toast({ title: isAr ? "تم الإضافة" : "Added" }); },
  });

  // Delete badge
  const deleteBadgeMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("product_trust_badges").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-trust-badges", companyId] }); toast({ title: isAr ? "تم الحذف" : "Deleted" }); },
  });

  // Toggle badge active
  const toggleBadgeMut = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("product_trust_badges").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-trust-badges", companyId] }),
  });

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setEditForm({ warranty_years: item.warranty_years || 0, platform_discount_pct: item.platform_discount_pct || 0, coupon_code: item.coupon_code || "", coupon_discount_pct: item.coupon_discount_pct || 0, original_price: item.original_price || "" });
  };

  return (
    <Tabs defaultValue="products" className="space-y-4">
      <TabsList>
        <TabsTrigger value="products">{isAr ? "المنتجات المتقدمة" : "Advanced Products"}</TabsTrigger>
        <TabsTrigger value="qa"><HelpCircle className="h-3.5 w-3.5 me-1" />{isAr ? "أسئلة وأجوبة" : "Q&A"} ({qaItems.length})</TabsTrigger>
        <TabsTrigger value="badges"><Shield className="h-3.5 w-3.5 me-1" />{isAr ? "شارات الثقة" : "Trust Badges"} ({badges.length})</TabsTrigger>
      </TabsList>

      {/* Products Extended */}
      <TabsContent value="products">
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isAr ? "المنتج" : "Product"}</TableHead>
                <TableHead>{isAr ? "الضمان" : "Warranty"}</TableHead>
                <TableHead>{isAr ? "خصم المنصة" : "Platform %"}</TableHead>
                <TableHead>{isAr ? "الكوبون" : "Coupon"}</TableHead>
                <TableHead>{isAr ? "السعر الأصلي" : "Orig. Price"}</TableHead>
                <TableHead>{isAr ? "نشط" : "Active"}</TableHead>
                <TableHead>{isAr ? "أرشيف" : "Archive"}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id} className={item.is_archived ? "opacity-50" : ""}>
                  <TableCell><p className="font-medium text-sm">{item.name}</p><p className="text-xs text-muted-foreground">{item.name_ar}</p></TableCell>
                  {editingId === item.id ? (
                    <>
                      <TableCell><Input type="number" className="w-16 h-8" value={editForm.warranty_years} onChange={e => setEditForm({ ...editForm, warranty_years: Number(e.target.value) })} /></TableCell>
                      <TableCell><Input type="number" className="w-16 h-8" value={editForm.platform_discount_pct} onChange={e => setEditForm({ ...editForm, platform_discount_pct: Number(e.target.value) })} /></TableCell>
                      <TableCell><div className="flex gap-1"><Input className="w-20 h-8" value={editForm.coupon_code} onChange={e => setEditForm({ ...editForm, coupon_code: e.target.value })} /><Input type="number" className="w-14 h-8" value={editForm.coupon_discount_pct} onChange={e => setEditForm({ ...editForm, coupon_discount_pct: Number(e.target.value) })} /></div></TableCell>
                      <TableCell><Input type="number" className="w-20 h-8" value={editForm.original_price} onChange={e => setEditForm({ ...editForm, original_price: e.target.value ? Number(e.target.value) : null })} /></TableCell>
                      <TableCell><Switch checked={item.is_active} onCheckedChange={v => toggleActiveMut.mutate({ id: item.id, active: v })} /></TableCell>
                      <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => archiveMut.mutate({ id: item.id, archived: !item.is_archived })}><Archive className="h-3 w-3" /></Button></TableCell>
                      <TableCell><div className="flex gap-1"><Button size="sm" className="h-7" onClick={() => updateMut.mutate({ id: item.id, updates: editForm })}><Save className="h-3 w-3 me-1" />{isAr ? "حفظ" : "Save"}</Button><Button variant="ghost" size="sm" className="h-7" onClick={() => setEditingId(null)}><X className="h-3 w-3" /></Button></div></TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>{item.warranty_years ? `${item.warranty_years}y` : "–"}</TableCell>
                      <TableCell>{item.platform_discount_pct ? `${item.platform_discount_pct}%` : "–"}</TableCell>
                      <TableCell>{item.coupon_code ? <Badge variant="outline" className="text-[10px]"><Tag className="h-2.5 w-2.5 me-1" />{item.coupon_code} ({item.coupon_discount_pct}%)</Badge> : "–"}</TableCell>
                      <TableCell>{item.original_price ? `${Number(item.original_price).toLocaleString()}` : "–"}</TableCell>
                      <TableCell><Switch checked={item.is_active} onCheckedChange={v => toggleActiveMut.mutate({ id: item.id, active: v })} /></TableCell>
                      <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => archiveMut.mutate({ id: item.id, archived: !item.is_archived })}><Archive className={`h-3 w-3 ${item.is_archived ? "text-chart-4" : "text-muted-foreground"}`} /></Button></TableCell>
                      <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(item)}><Edit className="h-3 w-3" /></Button></TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      </TabsContent>

      {/* Q&A Management */}
      <TabsContent value="qa" className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold">{isAr ? "أسئلة وأجوبة المنتجات" : "Product Q&A"}</h4>
          <Button size="sm" onClick={() => setShowQaForm(!showQaForm)}>{showQaForm ? <X className="h-4 w-4 me-1" /> : <Plus className="h-4 w-4 me-1" />}{showQaForm ? (isAr ? "إلغاء" : "Cancel") : (isAr ? "إضافة" : "Add")}</Button>
        </div>
        {showQaForm && (
          <Card className="border-primary/20">
            <CardContent className="pt-4 space-y-3">
              <div className="space-y-2">
                <Label>{isAr ? "المنتج" : "Product"} *</Label>
                <select className="w-full rounded-md border p-2 text-sm" value={qaForm.catalog_item_id} onChange={e => setQaForm({ ...qaForm, catalog_item_id: e.target.value })}>
                  <option value="">{isAr ? "اختر المنتج" : "Select product"}</option>
                  {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Question (EN)</Label><Input value={qaForm.question} onChange={e => setQaForm({ ...qaForm, question: e.target.value })} /></div>
                <div className="space-y-1"><Label>السؤال (AR)</Label><Input value={qaForm.question_ar} onChange={e => setQaForm({ ...qaForm, question_ar: e.target.value })} dir="rtl" /></div>
                <div className="space-y-1"><Label>Answer (EN)</Label><Textarea value={qaForm.answer} onChange={e => setQaForm({ ...qaForm, answer: e.target.value })} rows={2} /></div>
                <div className="space-y-1"><Label>الإجابة (AR)</Label><Textarea value={qaForm.answer_ar} onChange={e => setQaForm({ ...qaForm, answer_ar: e.target.value })} rows={2} dir="rtl" /></div>
                <div className="space-y-1"><Label>Answered By (EN)</Label><Input value={qaForm.answered_by} onChange={e => setQaForm({ ...qaForm, answered_by: e.target.value })} /></div>
                <div className="space-y-1"><Label>الإجابة بواسطة (AR)</Label><Input value={qaForm.answered_by_ar} onChange={e => setQaForm({ ...qaForm, answered_by_ar: e.target.value })} dir="rtl" /></div>
              </div>
              <Button size="sm" disabled={!qaForm.catalog_item_id || !qaForm.question} onClick={() => addQaMut.mutate()}><Save className="h-3.5 w-3.5 me-1" />{isAr ? "حفظ" : "Save"}</Button>
            </CardContent>
          </Card>
        )}
        {qaItems.length > 0 ? (
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>{isAr ? "المنتج" : "Product"}</TableHead>
                <TableHead>{isAr ? "السؤال" : "Question"}</TableHead>
                <TableHead>{isAr ? "الإجابة" : "Answer"}</TableHead>
                <TableHead>{isAr ? "مفيد" : "Helpful"}</TableHead>
                <TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {qaItems.map((qa: any) => {
                  const prod = items.find(i => i.id === qa.catalog_item_id);
                  return (
                    <TableRow key={qa.id}>
                      <TableCell className="text-xs font-medium">{prod?.name || "–"}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{isAr ? (qa.question_ar || qa.question) : qa.question}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{isAr ? (qa.answer_ar || qa.answer) : (qa.answer || "–")}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{qa.helpful_count}</Badge></TableCell>
                      <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteQaMut.mutate(qa.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent></Card>
        ) : !showQaForm && <p className="text-center text-sm text-muted-foreground py-8">{isAr ? "لا توجد أسئلة" : "No Q&A items"}</p>}
      </TabsContent>

      {/* Trust Badges Management */}
      <TabsContent value="badges" className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold">{isAr ? "شارات الثقة" : "Trust Badges"}</h4>
          <Button size="sm" onClick={() => setShowBadgeForm(!showBadgeForm)}>{showBadgeForm ? <X className="h-4 w-4 me-1" /> : <Plus className="h-4 w-4 me-1" />}{showBadgeForm ? (isAr ? "إلغاء" : "Cancel") : (isAr ? "إضافة" : "Add")}</Button>
        </div>
        {showBadgeForm && (
          <Card className="border-primary/20">
            <CardContent className="pt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Label (EN) *</Label><Input value={badgeForm.label} onChange={e => setBadgeForm({ ...badgeForm, label: e.target.value })} /></div>
                <div className="space-y-1"><Label>التسمية (AR)</Label><Input value={badgeForm.label_ar} onChange={e => setBadgeForm({ ...badgeForm, label_ar: e.target.value })} dir="rtl" /></div>
                <div className="space-y-1"><Label>Icon</Label><Input value={badgeForm.icon_name} onChange={e => setBadgeForm({ ...badgeForm, icon_name: e.target.value })} placeholder="ShieldCheck" /></div>
                <div className="space-y-1"><Label>Color</Label><Input value={badgeForm.color_class} onChange={e => setBadgeForm({ ...badgeForm, color_class: e.target.value })} placeholder="text-primary" /></div>
              </div>
              <Button size="sm" disabled={!badgeForm.label} onClick={() => addBadgeMut.mutate()}><Save className="h-3.5 w-3.5 me-1" />{isAr ? "حفظ" : "Save"}</Button>
            </CardContent>
          </Card>
        )}
        {badges.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {badges.map((b: any) => (
              <Card key={b.id} className={!b.is_active ? "opacity-50" : ""}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{b.label}</p>
                    {b.label_ar && <p className="text-xs text-muted-foreground" dir="rtl">{b.label_ar}</p>}
                    <p className="text-[10px] text-muted-foreground mt-0.5">Icon: {b.icon_name} · {b.color_class}</p>
                  </div>
                  <Switch checked={b.is_active} onCheckedChange={v => toggleBadgeMut.mutate({ id: b.id, active: v })} />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteBadgeMut.mutate(b.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !showBadgeForm && <p className="text-center text-sm text-muted-foreground py-8">{isAr ? "لا توجد شارات" : "No trust badges"}</p>}
      </TabsContent>
    </Tabs>
  );
}
